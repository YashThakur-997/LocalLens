const cloudinary = require('../config/cloudinary');
const WorkerPost = require('../models/worker.post.model');
const User = require('../models/user.model');

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });

const serializePost = (post) => ({
  id: post._id,
  worker: post.worker
    ? {
        id: post.worker._id,
        username: post.worker.username,
      }
    : null,
  title: post.title,
  category: post.category,
  location: post.location,
  mediaUrl: post.mediaUrl,
  mediaType: post.mediaType,
  createdAt: post.createdAt,
});

exports.create_worker_post_handler = async (req, res) => {
  try {
    const workerId = req.user?.id;
    const { title, category, location } = req.body;

    if (!workerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const worker = await User.findById(workerId).select('role');

    if (!worker) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can create posts' });
    }

    if (!title?.trim() || !category?.trim() || !location?.trim()) {
      return res.status(400).json({ message: 'title, category, and location are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A media file is required' });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, 'LocalLens/worker-posts');
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';

    const post = await WorkerPost.create({
      worker: workerId,
      title: title.trim(),
      category: category.trim(),
      location: location.trim(),
      mediaUrl: uploadResult.secure_url,
      mediaPublicId: uploadResult.public_id,
      mediaType,
    });

    const populatedPost = await WorkerPost.findById(post._id).populate('worker', 'username');

    return res.status(201).json({
      message: 'Upload published successfully',
      post: serializePost(populatedPost),
    });
  } catch (err) {
    console.error('Create worker post error:', err);
    return res.status(500).json({ message: 'Unable to create upload right now.' });
  }
};

const fetchWorkerPosts = async (workerId) => {
  const posts = await WorkerPost.find({ worker: workerId })
    .populate('worker', 'username')
    .sort({ createdAt: -1 });

  return posts.map(serializePost);
};

exports.get_my_posts_handler = async (req, res) => {
  try {
    const workerId = req.user?.id;

    if (!workerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const worker = await User.findById(workerId).select('role');

    if (!worker) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({ message: 'Only workers can view uploads' });
    }

    const posts = await fetchWorkerPosts(workerId);
    return res.status(200).json({ posts });
  } catch (err) {
    console.error('My worker posts fetch error:', err);
    return res.status(500).json({ message: 'Unable to load uploads right now.' });
  }
};

exports.get_worker_posts_handler = async (req, res) => {
  try {
    const { workerId } = req.params;
    const posts = await fetchWorkerPosts(workerId);
    return res.status(200).json({ posts });
  } catch (err) {
    console.error('Worker posts fetch error:', err);
    return res.status(500).json({ message: 'Unable to load worker uploads right now.' });
  }
};