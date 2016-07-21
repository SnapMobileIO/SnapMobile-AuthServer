'use strict';

import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin';
import crypto from 'crypto';

export function initialize(User, Auth, callback) {
  passport.use(new LinkedInStrategy({
      consumerKey: process.env.LINKEDIN_API_KEY,
      consumerSecret: process.env.LINKEDIN_SECRET_KEY,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline', 'picture-url',
        'industry']
    },
    function(token, tokenSecret, profile, done) {
      User.findOne({ email: profile.emails[0].value.toLowerCase() })
      .then(user => {
        if (!user) { // not registered

          //generate a random password for using Facebook login

          var randomPassword = crypto.randomBytes(16).toString('base64');

          let userObject = {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value.toLowerCase(),
            password: randomPassword,
            provider: 'linkedin',
            socialProfiles: {
              linkedin: {
                id: profile.id,
                info: profile._json.headline,
              }
            }
          };
          if (profile._json.pictureUrl) {
            userObject.socialProfiles.linkedin.avatar = profile._json.pictureUrl;
          }

          User.create(userObject).then(result => {
            result = result.toObject();
            result.token = Auth.signToken(result._id);
            callback(result, profile);
            return done(false, result);
          })
          .catch(err => done(err));

        } else { // is registered
          if (!user.socialProfiles) {
            user.socialProfiles = { linkedin: {} };
          }

          user.socialProfiles.linkedin.id = profile.id;
          if (!user.socialProfiles.linkedin.info || user.socialProfiles.linkedin.info == '') {
            user.socialProfiles.linkedin.info = profile._json.headline;
          }

          if (!user.firstName || user.firstName == '') {
            user.firstName = profile.name.givenName;
          }

          if (!user.lastName || user.lastName == '') {
            user.lastName = profile.name.familyName;
          }

          if (profile._json.pictureUrl) {
            user.socialProfiles.linkedin.avatar = profile._json.pictureUrl;
          }

          user.markModified('socialProfiles');

          user.save();

          callback(user, profile);
          return done(false, user);
        }
      })
      .catch(err => done(err));
    }
  ));
}
