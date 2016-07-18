'use strict';

import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin';
import crypto from 'crypto';

export function setup(User, Auth) {
  passport.use(new LinkedInStrategy({
      consumerKey: process.env.LINKEDIN_API_KEY,
      consumerSecret: process.env.LINKEDIN_SECRET_KEY,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
    },
    function(token, tokenSecret, profile, done) {
      User.findOne({ email: profile.emails[0].value.toLowerCase() })
      .then(user => {
        if (!user) { // not registered

          //generate a random password for using Facebook login

          var randomPassword = crypto.randomBytes(16).toString('base64');

          User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value.toLowerCase(),
            linkedinID: profile.id,
            password: randomPassword,
            provider: 'linkedin',
            info: profile._json.headline
          }).then(result => {
            result = result.toObject();
            result.token = Auth.signToken(result._id);
            return done(false, result);
          })
          .catch(err => done(err));
        } else { // is registered
          user.linkedinID = profile.id;
          if (!user.info || user.info == '') {
            user.info = profile._json.headline;
          }

          if (!user.firstName || user.firstName == '') {
            user.firstName = profile.name.givenName;
          }

          if (!user.lastName || user.lastName == '') {
            user.lastName = profile.name.familyName;
          }

          user.save();
          return done(false, user);
        }
      })
      .catch(err => done(err));
    }
  ));
}
