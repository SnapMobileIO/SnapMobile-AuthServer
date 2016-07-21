'use strict';

import { Router } from 'express';

const router = new Router();

var local = require('./local');

router.use('/login', local.router);


/**
 * Sets the User of Auth and its dependencies for reference
 * @param {User} _user An instance of the User class
 */
function setUser(_user) {
  local.setUser(_user);
}

function initialize(_user, integrations = {}) {
  setUser(_user);

  if (integrations.some(item => item.name === 'facebook')) {
    var facebook = require('./facebook');
    var callback = integrations.find(item => item.name == 'facebook').callback;

    router.use('/facebook', facebook.router);
    facebook.initialize(_user, callback);
  }

  if (integrations.some(item => item.name == 'linkedin') >= 0) {
    var callback = integrations.find(item => item.name == 'linkedin').callback;
    var linkedin = require('./linkedin');

    router.use('/linkedin', linkedin.router);
    linkedin.initialize(_user, callback);
  }
}

module.exports.authService = local.authService;
module.exports.router = router;
module.exports.setUser = setUser;
module.exports.initialize = initialize;
