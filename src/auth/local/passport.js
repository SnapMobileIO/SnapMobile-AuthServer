'use strict';

import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

export function setup(User) {
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password',
    },
    function(email, password, done) {
      User.findOne({ email: email.toLowerCase() })
      .then(user => {
        if (!user) { return done(null, false, { message: 'This email is not registered.' }); }

        user.authenticate(password, (err, authenticated) => {
          if (err) {
            return done(null, false, { message: err.message });
          }

          if (!authenticated) {
            return done(null, false, { message: 'This password is not correct.' });
          }

          return done(null, user);
        });
      })
      .catch(err => done(err));
    }
  ));
}
