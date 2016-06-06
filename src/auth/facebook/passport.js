'use strict';

import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';

export function setup(User, Auth) {
  passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'first_name', 'last_name', 'email']
    },
    function(accessToken, refreshToken, profile, done) {
      User.findOne({ email: profile.emails[0].value.toLowerCase() })
      .then(user => {
        if (!user) { // not registered

          //generate a random password for using Facebook login

          var randomPassword = crypto.randomBytes(16).toString('base64');

          User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value.toLowerCase(),
            facebookID: profile.id,
            password: randomPassword,
            provider: 'facebook',
            facebookAccessToken: accessToken,
            facebookRefreshToken: refreshToken,
          }).then(result => {
            result = result.toObject();
            result.token = Auth.signToken(result._id);
            return done(false, result);
          })
          .catch(err => done(err));
        } else { // is registered
          user.facebookID = profile.id;
          user.facebookAccessToken = accessToken;
          user.facebookRefreshToken = refreshToken;
          user.save();
          return done(false, user);
        }
      })
      .catch(err => done(err));
    }
  ));
}
