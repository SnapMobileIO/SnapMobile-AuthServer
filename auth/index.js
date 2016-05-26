'use strict';

var _express = require('express');

var router = new _express.Router();

router.use('/login', require('./local'));

module.exports = router;