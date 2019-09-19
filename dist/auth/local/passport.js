'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setup = setup;

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportLocal = require('passport-local');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setup(User) {
  _passport2.default.use(new _passportLocal.Strategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function (email, password, done) {
    User.findOne({
      email: email.toLowerCase()
    }).then(function (user) {
      if (!user) {
        return done(null, false, {
          message: 'This email is not registered.'
        });
      }
      if (!user.password) {
        return done(null, false, {
          message: 'Password requirements have changed. Please reset your password.'
        });
      }
      user.authenticate(password, function (err, authenticated) {
        if (err) {
          return done(null, false, {
            message: err.message
          });
        }

        if (!authenticated) {
          return done(null, false, {
            message: 'This password is not correct.'
          });
        }

        return done(null, user);
      });
    }).catch(function (err) {
      return done(err);
    });
  }));
}