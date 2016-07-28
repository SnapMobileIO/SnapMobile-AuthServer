'use strict';

import { Router } from 'express';
import graph from 'fbgraph';
import passport from 'passport';
import * as facebookPassport from './passport';
import crypto from 'crypto';

var auth = require('../auth.service');

const router = new Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function initialize(_user, callback) {
  auth.setUser(_user);

  facebookPassport.initialize(_user, auth, callback);

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
        if (!profile.email) {
          return;
        }

        _user.findOne({ email: profile.email.toLowerCase() })
          .then(user => {
            if (!user) { // not registered
              //generate a random password for using Facebook login

              var randomPassword = crypto.randomBytes(16).toString('base64');

              _user.create({
                firstName: profile.first_name,
                lastName: profile.last_name,
                email: profile.email.toLowerCase(),
                facebookID: profile.id,
                password: randomPassword,
                provider: 'facebook',
                socialProfiles: {
                  facebook: {
                    accessToken: req.body.accessToken,
                    avatar: profile.picture.data.url
                  }
                }
              }).then(result => {
                callback(result, profile);
                result = result.toObject();
                let token = auth.signToken(result._id);
                res.json({ token });
              })
              .catch(err => {
                console.log(err);
                res.status(400).json({ message: 'Could not create user, please try again.' });
              });
            } else { // is registered
              if (!user.socialProfiles) {
                user.socialProfiles = { facebook: {} };
              }

              user.socialProfiles.facebook.id = profile.id;
              user.socialProfiles.facebook.accessToken = req.body.accessToken;
              user.save();

              callback(user, profile);
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
module.exports.initialize = initialize;
