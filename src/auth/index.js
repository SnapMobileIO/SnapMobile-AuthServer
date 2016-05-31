'use strict';

import { Router } from 'express';

const router = new Router();

var local = require('./local');

router.use('/login', local.router);

function setUser(_user) {
	local.setUser(_user);
}

module.exports.authService = local.authService;
module.exports.router = router;
module.exports.setUser = setUser;