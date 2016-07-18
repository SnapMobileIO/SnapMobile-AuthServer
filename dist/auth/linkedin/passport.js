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

function setup(User, Auth) {
  _passport2.default.use(new _passportLinkedin.Strategy({
    consumerKey: process.env.LINKEDIN_API_KEY,
    consumerSecret: process.env.LINKEDIN_SECRET_KEY,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
  }, function (token, tokenSecret, profile, done) {
    User.findOne({ email: profile.emails[0].value.toLowerCase() }).then(function (user) {
      if (!user) {
        // not registered

        //generate a random password for using Facebook login

        var randomPassword = _crypto2.default.randomBytes(16).toString('base64');

        User.create({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value.toLowerCase(),
          linkedinID: profile.id,
          password: randomPassword,
          provider: 'linkedin',
          info: profile._json.headline
        }).then(function (result) {
          result = result.toObject();
          result.token = Auth.signToken(result._id);
          return done(false, result);
        }).catch(function (err) {
          return done(err);
        });
      } else {
        // is registered
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
    }).catch(function (err) {
      return done(err);
    });
  }));
}