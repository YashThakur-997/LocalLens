let router = require('express').Router();
let { requestCompletion, verifyAndRate } = require('../controllers/otp.validation');
let authMiddleware = require('../middlewares/auth.token');
let { createJob, getCurrentWork, getClientBookings, getWorkerRequests, updateJobStatus } = require('../controllers/job.controller');

router.post('/create', authMiddleware, createJob);

router.get('/current-work', authMiddleware, getCurrentWork);

router.get('/client-bookings', authMiddleware, getClientBookings);

router.get('/worker-requests', authMiddleware, getWorkerRequests);

router.patch('/worker-requests/:jobId', authMiddleware, updateJobStatus);

router.post('/request-completion/:jobId', authMiddleware, requestCompletion);

router.post('/verify-and-rate', authMiddleware, verifyAndRate);

module.exports = router;