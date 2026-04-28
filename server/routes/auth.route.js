let router = require('express').Router();
let { login_handler, signup_handler ,logout_handler, profile_handler, search_workers_handler, get_worker_handler } = require('../controllers/auth.controller');
let { loginvalidation, signupvalidation } = require('../middlewares/auth.validation');
let authMiddleware = require('../middlewares/auth.token');


router.post('/login', loginvalidation, login_handler);

router.post('/signup', signupvalidation, signup_handler);

router.post('/logout', logout_handler);

router.get('/me', authMiddleware, profile_handler);

router.get('/workers', authMiddleware, search_workers_handler);

router.get('/workers/:workerId', authMiddleware, get_worker_handler);

module.exports = router;