let router = require('express').Router();
let { requestCompletion, verifyAndRate } = require('../controllers/otp.validation');
let authMiddleware = require('../middlewares/auth.token');
let { createJob } = require('../controllers/job.controller');

router.post('/create', authMiddleware, createJob);

router.post('/request-completion/:jobId', authMiddleware, requestCompletion);

router.post('/verify-and-rate', authMiddleware, verifyAndRate);

module.exports = router;