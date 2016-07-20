'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportLinkedin = require('passport-linkedin');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setup(User, Auth, Tag) {
  _passport2.default.use(new _passportLinkedin.Strategy({
    consumerKey: process.env.LINKEDIN_API_KEY,
    consumerSecret: process.env.LINKEDIN_SECRET_KEY,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline', 'picture-url', 'industry']
  }, function (token, tokenSecret, profile, done) {
    User.findOne({ email: profile.emails[0].value.toLowerCase() }).then(function (user) {
      if (!user) {
        var randomPassword;

        (function () {
          // not registered

          //generate a random password for using Facebook login

          randomPassword = _crypto2.default.randomBytes(16).toString('base64');


          var userObject = {
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value.toLowerCase(),
            password: randomPassword,
            provider: 'linkedin',
            socialProfiles: {
              linkedin: {
                id: profile.id,
                info: profile._json.headline
              }
            }
          };
          if (profile._json.pictureUrl) {
            userObject.socialProfiles.linkedin.avatar = profile._json.pictureUrl;
          }

          if (Tag && profile._json.industry) {
            Tag.findOrCreate(profile._json.industry).then(function (tag) {
              userObject._tags = [tag._id];
              User.create(userObject).then(function (result) {
                result = result.toObject();
                result.token = Auth.signToken(result._id);
                return done(false, result);
              }).catch(function (err) {
                return done(err);
              });
            });
          } else {
            User.create(userObject).then(function (result) {
              result = result.toObject();
              result.token = Auth.signToken(result._id);
              return done(false, result);
            }).catch(function (err) {
              return done(err);
            });
          }
        })();
      } else {
        // is registered
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

        if (Tag && profile._json.industry) {
          Tag.findOrCreate(profile._json.industry).then(function (tag) {
            if (user._tags.indexOf(tag._id) === -1) {
              user._tags.push([tag._id]);
              user.save();
            }
          });
        }

        user.save();
        return done(false, user);
      }
    }).catch(function (err) {
      return done(err);
    });
  }));
}