'use strict';

import { Router } from 'express';

const router = new Router();

router.use('/login', require('./local'));

module.exports = router;
