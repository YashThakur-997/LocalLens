const express = require('express');

const authMiddleware = require('../middlewares/auth.token');
const upload = require('../middlewares/upload');
const {
  create_worker_post_handler,
  get_my_posts_handler,
  get_worker_posts_handler,
} = require('../controllers/post.controller');

const router = express.Router();

router.post('/', authMiddleware, upload.single('media'), create_worker_post_handler);
router.get('/me', authMiddleware, get_my_posts_handler);
router.get('/worker/:workerId', authMiddleware, get_worker_posts_handler);

module.exports = router;