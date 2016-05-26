'use strict';

var _express = require('express');

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _auth = require('../auth.service');

var _user = require('../../user/user.model');

var _user2 = _interopRequireDefault(_user);

var _passport3 = require('./passport');

var localPassport = _interopRequireWildcard(_passport3);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = new _express.Router();

localPassport.setup(_user2.default);

router.post('/', function (req, res, next) {
  _passport2.default.authenticate('local', function (err, user, info) {
    var error = err || info;
    if (error) {
      return res.status(422).json(error);
    }

    if (!user) {
      return res.status(404).json({ message: 'Something went wrong, please try again.' });
    }

    var token = (0, _auth.signToken)(user._id);
    res.json({ token: token });
  })(req, res, next);
});

module.exports = router;