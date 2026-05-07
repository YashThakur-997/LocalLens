let router = require('express').Router();
let { requestCompletion, markNotComplete, verifyAndRate } = require('../controllers/job-completion.controller');
let authMiddleware = require('../middlewares/auth.token');
let { createJob, getCurrentWork, getClientBookings, getWorkerRequests, updateJobStatus, getWorkerReviews } = require('../controllers/job.controller');

router.post('/create', authMiddleware, createJob);

router.get('/current-work', authMiddleware, getCurrentWork);

router.get('/client-bookings', authMiddleware, getClientBookings);

router.get('/worker-requests', authMiddleware, getWorkerRequests);

router.get('/worker-reviews/:workerId', getWorkerReviews);

router.patch('/worker-requests/:jobId', authMiddleware, updateJobStatus);

router.post('/request-completion/:jobId', authMiddleware, requestCompletion);

router.post('/mark-not-complete/:jobId', authMiddleware, markNotComplete);

router.post('/verify-and-rate', authMiddleware, verifyAndRate);

module.exports = router;