'use strict';

import { Router } from 'express';

const router = new Router();

var local = require('./local');

router.use('/login', local.router);

module.exports = {
	router: router,
	authService: local.authService,
	setUser: function(User) {
		local.setUser(User);
	}
};
