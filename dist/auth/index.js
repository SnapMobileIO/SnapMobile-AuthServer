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
  var facebook = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  local.setUser(_user);
  if (facebook) {
    var facebook = require('./facebook');

    router.use('/facebook', facebook.router);
    facebook.setUser(_user);
  }
}

module.exports.authService = local.authService;
module.exports.router = router;
module.exports.setUser = setUser;