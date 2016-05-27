'use strict';

import { Router } from 'express';
import passport from 'passport';
import * as localPassport from './passport';

var auth = require('../auth.service');

const router = new Router();

module.exports = {
  router: router,
  authService: auth,
  setUser: function(User) {
    auth.setUser(User)
    localPassport.setup(User);
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
};