'use strict';

import { Router } from 'express';
import passport from 'passport';
import { signToken } from '../auth.service';
import User from '../../user/user.model';
import * as localPassport from './passport';

const router = new Router();

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

    let token = signToken(user._id);
    res.json({ token });
  })(req, res, next);
});

module.exports = router;
