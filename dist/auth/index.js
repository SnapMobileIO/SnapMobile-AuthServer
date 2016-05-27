'use strict';

var _express = require('express');

var router = new _express.Router();

var local = require('./local');

router.use('/login', local.router);

module.exports = {
	router: router,
	setUser: function setUser(User) {
		local.setUser(User);
	}
};