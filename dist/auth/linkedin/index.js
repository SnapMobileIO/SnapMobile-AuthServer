'use strict';

var _express = require('express');

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passport3 = require('./passport');

var linkedinPassport = _interopRequireWildcard(_passport3);

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
function setUser(_user) {
  auth.setUser(_user);

  linkedinPassport.setup(_user, auth);
  router.get('/', _passport2.default.authenticate('linkedin', { scope: 'r_emailaddress' }));

  router.get('/callback', function (req, res, next) {
    _passport2.default.authenticate('linkedin', { failureRedirect: '/login' }, function (err, user) {
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

  /*router.post('/', (req, res, next) => {
    let fields = ['id', 'first-name', 'last-name', 'email', 'picture'];
    graph.get('me?fields=' + fields.join()
        + '&access_token=' + req.body.accessToken, function(err, profile) {
        _user.findOne({ email: profile.email.toLowerCase() })
          .then(user => {
            if (!user) { // not registered
              //generate a random password for using Facebook login
               var randomPassword = crypto.randomBytes(16).toString('base64');
               _user.create({
                firstName: profile.first_name,
                lastName: profile.last_name,
                email: profile.email.toLowerCase(),
                facebookID: profile.id,
                password: randomPassword,
                provider: 'facebook',
                facebookAccessToken: req.body.accessToken,
                avatar: { url: profile.picture.data.url, hostedType: 'external' }
              }).then(result => {
                result = result.toObject();
                let token = auth.signToken(result._id);
                res.json({ token });
              })
              .catch(err => {
                console.log(err);
                res.status(400).json({ message: 'Could not create user, please try again.' });
              });
            } else { // is registered
              user.facebookID = profile.id;
              user.facebookAccessToken = req.body.accessToken;
              user.save();
              let token = auth.signToken(user._id);
              res.json({ token });
            }
          })
          .catch(err => {
            console.log(err);
            res.status(400).json({ message: 'Something went wrong, please try again.' });
          });
      });
  });*/
}

module.exports.authService = auth;
module.exports.router = router;
module.exports.setUser = setUser;