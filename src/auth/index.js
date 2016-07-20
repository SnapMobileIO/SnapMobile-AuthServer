'use strict';

import { Router } from 'express';

const router = new Router();

var local = require('./local');

router.use('/login', local.router);


/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user, integrations = [], _tag = null) {
  local.setUser(_user);
  if (integrations.indexOf('facebook') >= 0) {
    var facebook = require('./facebook');

    router.use('/facebook', facebook.router);
    facebook.setUser(_user);
  }

  if (integrations.indexOf('linkedin') >= 0) {
    var linkedin = require('./linkedin');

    router.use('/linkedin', linkedin.router);
    linkedin.setUser(_user, _tag);
  }
}

module.exports.authService = local.authService;
module.exports.router = router;
module.exports.setUser = setUser;
