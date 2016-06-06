'use strict';

import { Router } from 'express';
import passport from 'passport';
import * as facebookPassport from './passport';
import graph from 'fbgraph';

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
    let fields = [''];
    graph.get('me?fields=access_token=' + req.body.accessToken, function(err, res) {
      console.log(res); // { id: '4', name: 'Mark Zuckerberg'... }
    });
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.setUser = setUser;
