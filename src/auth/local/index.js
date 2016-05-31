'use strict';

import { Router } from 'express';
import passport from 'passport';
import * as localPassport from './passport';

var auth = require('../auth.service');

const router = new Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user) {
  auth.setUser(_user);
  localPassport.setup(_user);
  router.post('/', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      let error = err || info;
      if (error) {
        return res.status(422).json(error);
      }

      if (!user) {
        return res.status(404).json({ message: 'Something went wrong, please try again.' });
      }

      let token = auth.signToken(user._id);
      res.json({ token });
    })(req, res, next);
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.setUser = setUser;
