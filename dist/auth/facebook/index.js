'use strict';

var _express = require('express');

var _fbgraph = require('fbgraph');

var _fbgraph2 = _interopRequireDefault(_fbgraph);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passport3 = require('./passport');

var facebookPassport = _interopRequireWildcard(_passport3);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var auth = require('../auth.service');

var router = new _express.Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function initialize(_user, callback) {
  auth.setUser(_user);

  facebookPassport.initialize(_user, auth, callback);

  router.get('/', _passport2.default.authenticate('facebook', { scope: 'email' }));

  router.get('/callback', function (req, res, next) {
    _passport2.default.authenticate('facebook', { failureRedirect: '/login' }, function (err, user) {
      if (!user) {
        console.log(err);
        console.log(user);
        return res.status(404).json({ message: 'Something went wrong, please try again.' });
      }

      var token = auth.signToken(user._id);
      res.cookie('token', token);
      res.json({ token: token });
    })(req, res, next);
  });

  router.post('/', function (req, res, next) {
    var fields = ['id', 'first_name', 'last_name', 'email', 'picture'];
    _fbgraph2.default.get('me?fields=' + fields.join() + '&access_token=' + req.body.accessToken, function (err, profile) {
      if (!profile.email) {
        return;
      }

      _user.findOne({ email: profile.email.toLowerCase() }).then(function (user) {
        if (!user) {
          // not registered
          //generate a random password for using Facebook login

          var randomPassword = _crypto2.default.randomBytes(16).toString('base64');

          _user.create({
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email.toLowerCase(),
            facebookID: profile.id,
            password: randomPassword,
            provider: 'facebook',
            socialProfiles: {
              facebook: {
                accessToken: req.body.accessToken,
                avatar: profile.picture.data.url
              }
            }
          }).then(function (result) {
            callback(result, profile);
            result = result.toObject();
            var token = auth.signToken(result._id);
            res.json({ token: token });
          }).catch(function (err) {
            console.log(err);
            res.status(400).json({ message: 'Could not create user, please try again.' });
          });
        } else {
          // is registered
          if (!user.socialProfiles) {
            user.socialProfiles = { facebook: {} };
          }

          user.socialProfiles.facebook.id = profile.id;
          user.socialProfiles.facebook.accessToken = req.body.accessToken;
          user.save();

          callback(user, profile);
          var token = auth.signToken(user._id);
          res.json({ token: token });
        }
      }).catch(function (err) {
        console.log(err);
        res.status(400).json({ message: 'Something went wrong, please try again.' });
      });
    });
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.initialize = initialize;