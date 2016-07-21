'use strict';

var _express = require('express');

var router = new _express.Router();

var local = require('./local');

router.use('/login', local.router);

/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user) {
  local.setUser(_user);
}

function initialize(_user) {
  var integrations = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  setUser(_user);

  if (integrations.some(function (item) {
    return item.name === 'facebook';
  })) {
    var facebook = require('./facebook');
    var callback = integrations.find(function (item) {
      return item.name == 'facebook';
    }).callback;

    router.use('/facebook', facebook.router);
    facebook.initialize(_user, callback);
  }

  if (integrations.some(function (item) {
    return item.name == 'linkedin';
  }) >= 0) {
    var callback = integrations.find(function (item) {
      return item.name == 'linkedin';
    }).callback;
    var linkedin = require('./linkedin');

    router.use('/linkedin', linkedin.router);
    linkedin.initialize(_user, callback);
  }
}

module.exports.authService = local.authService;
module.exports.router = router;
module.exports.setUser = setUser;
module.exports.initialize = initialize;