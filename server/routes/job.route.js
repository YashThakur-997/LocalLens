let router = require('express').Router();
let { requestCompletion, verifyAndRate } = require('../controllers/otp.validation');
let { createJob } = require('../controllers/job.controller');

router.post('/create', createJob);

router.post('/request-completion/:jobId', requestCompletion);

router.post('/verify-and-rate', verifyAndRate);

module.exports = router;