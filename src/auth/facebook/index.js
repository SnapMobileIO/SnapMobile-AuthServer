'use strict';

import { Router } from 'express';
import graph from 'fbgraph';
import passport from 'passport';
import * as facebookPassport from './passport';

var auth = require('../auth.service');

const router = new Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user) {
  auth.setUser(_user);

  facebookPassport.setup(_user, auth);

  router.get('/',
    passport.authenticate('facebook', { scope: 'email' }));

  router.get('/callback', (req, res, next) => {
    passport.authenticate('facebook', { failureRedirect: '/login' },
    (err, user) => {
      if (!user) {
        console.log(err);
        console.log(user);
        return res.status(404).json({ message: 'Something went wrong, please try again.' });
      }

      let token = auth.signToken(user._id);
      res.cookie('token', token);
      res.json({ token });
    })(req, res, next);
  });

  router.post('/', (req, res, next) => {
    let fields = ['id', 'first_name', 'last_name', 'email', 'picture'];
    graph.get('me?fields=' + fields.join()
        + '&access_token=' + req.body.accessToken, function(err, profile) {
        _user.findOne({ email: profile.email.toLowerCase() })
          .then(user => {
            if (!user) { // not registered
              //generate a random password for using Facebook login
              let passwordCharacters =
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
              let passwordLength = 20;
              let randomPassword = Array(passwordLength).join().split(',')
                .map(function() { return passwordCharacters
                .charAt(Math.floor(Math.random() * passwordCharacters.length)); })
                .join('');
              _user.create({
                firstName: profile.first_name,
                lastName: profile.last_name,
                email: profile.email.toLowerCase(),
                facebookID: profile.id,
                password: randomPassword,
                provider: 'facebook',
                facebookAccessToken: req.body.accessToken,
                avatar: profile.picture.data.url
              }).then(result => {
                result = result.toObject();
                let token = auth.signToken(result._id);
                res.json({ token });
              })
              .catch(err => {
                console.log(err);
                res.status(400).json({ message: 'Could not create user, please try again.' });
              });
            } else { // is registered
              user.facebookID = profile.id;
              user.facebookAccessToken = req.body.accessToken;
              user.save();
              let token = auth.signToken(user._id);
              res.json({ token });
            }
          })
          .catch(err => {
            console.log(err);
            res.status(400).json({ message: 'Something went wrong, please try again.' });
          });
      });
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.setUser = setUser;
