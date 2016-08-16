'use strict';

var _express = require('express');

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passport3 = require('./passport');

var linkedinPassport = _interopRequireWildcard(_passport3);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var auth = require('../auth.service');
var Linkedin = require('node-linkedin')(process.env.LINKEDIN_API_KEY, process.env.LINKEDIN_SECRET_KEY, process.env.LINKEDIN_CALLBACK_URL);

var router = new _express.Router();

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function initialize(_user, callback) {
  auth.setUser(_user);

  linkedinPassport.initialize(_user, auth, callback);
  router.get('/', _passport2.default.authenticate('linkedin', { scope: 'r_emailaddress' }));

  router.get('/callback', function (req, res, next) {
    _passport2.default.authenticate('linkedin', { failureRedirect: '/login' }, function (err, user) {
      if (!user) {
        console.error(err);
        return res.status(404).json({ message: 'Something went wrong, please try again.' });
      }

      var token = auth.signToken(user._id);
      res.cookie('token', token);
      res.json({ token: token });
    })(req, res, next);
  });

  router.post('/', function (req, res, next) {
    var options = {
      url: 'https://www.linkedin.com/oauth/v2/accessToken',
      method: 'POST',
      headers: {},
      form: {
        grant_type: 'authorization_code',
        code: req.body.code,
        redirect_uri: 'http://' + req.headers.host + '/linkedin-callback',
        client_id: process.env.LINKEDIN_API_KEY,
        client_secret: process.env.LINKEDIN_SECRET_KEY
      }
    };
    _request2.default.post(options, function (error, response, body) {
      var bodyJSON = JSON.parse(body);
      if (!bodyJSON.access_token) {
        return;
      }

      var linkedin = Linkedin.init(bodyJSON.access_token);
      linkedin.people.me(function (err, linkedInUser) {
        _user.findOne({ email: linkedInUser.emailAddress.toLowerCase() }).then(function (user) {
          if (!user) {
            // not registered

            //generate a random password for using Facebook login

            var randomPassword = _crypto2.default.randomBytes(16).toString('base64');

            var userObject = {
              firstName: linkedInUser.firstName,
              lastName: linkedInUser.lastName,
              email: linkedInUser.emailAddress.toLowerCase(),
              password: randomPassword,
              provider: 'linkedin',
              socialProfiles: {
                linkedin: {
                  id: linkedInUser.id,
                  info: linkedInUser.headline
                }
              }
            };
            if (linkedInUser.pictureUrl) {
              userObject.socialProfiles.linkedin.avatar = linkedInUser.pictureUrl;
            }
            _user.create(userObject).then(function (result) {
              callback(result, linkedInUser);
              var token = auth.signToken(result._id);
              res.json({ token: token });
            }).catch(function (err) {
              return res.status(400).json({ message: 'Could not create user, please try again.' });
            });
          } else {
            // is registered
            if (!user.socialProfiles) {
              user.socialProfiles = { linkedin: {} };
            }

            if (!user.socialProfiles.linkedin) {
              user.socialProfiles.linkedin = {};
            }
            user.socialProfiles.linkedin.id = linkedInUser.id;
            if (!user.socialProfiles.linkedin.info || user.socialProfiles.linkedin.info == '') {
              user.socialProfiles.linkedin.info = linkedInUser.headline;
            }
            if (!user.firstName || user.firstName == '') {
              user.firstName = linkedInUser.firstName;
            }
            if (!user.lastName || user.lastName == '') {
              user.lastName = linkedInUser.lastName;
            }
            if (linkedInUser.pictureUrl) {
              user.socialProfiles.linkedin.avatar = linkedInUser.pictureUrl;
            }

            user.markModified('socialProfiles');

            user.save();
            callback(user, linkedInUser);
            var token = auth.signToken(user._id);
            res.json({ token: token });
          }
        }).catch(function (err) {
          return res.status(400).json({ message: 'Could not create user, please try again.' });
        });
      });
    });
  });
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.initialize = initialize;
