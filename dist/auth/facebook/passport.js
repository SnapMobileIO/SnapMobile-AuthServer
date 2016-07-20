'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportFacebook = require('passport-facebook');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setup(User, Auth) {
  _passport2.default.use(new _passportFacebook.Strategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'first_name', 'last_name', 'email']
  }, function (accessToken, refreshToken, profile, done) {
    User.findOne({ email: profile.emails[0].value.toLowerCase() }).then(function (user) {
      if (!user) {
        // not registered

        //generate a random password for using Facebook login

        var randomPassword = crypto.randomBytes(16).toString('base64');

        User.create({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value.toLowerCase(),
          password: randomPassword,
          provider: 'facebook',
          socialProfiles: {
            facebook: {
              id: profile.id,

              accessToken: accessToken,
              refreshToken: refreshToken
            }
          }
        }).then(function (result) {
          result = result.toObject();
          result.token = Auth.signToken(result._id);
          return done(false, result);
        }).catch(function (err) {
          return done(err);
        });
      } else {
        // is registered

        if (!user.socialProfiles) {
          user.socialProfiles = { facebook: {} };
        }

        user.socialProfiles.facebook.id = profile.id;
        user.socialProfiles.facebook.accessToken = accessToken;
        user.socialProfiles.facebook.refreshToken = refreshToken;
        user.save();
        return done(false, user);
      }
    }).catch(function (err) {
      return done(err);
    });
  }));
}