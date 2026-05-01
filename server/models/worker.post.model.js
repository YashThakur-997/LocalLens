const mongoose = require('mongoose');

const workerPostSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    mediaUrl: { type: String, required: true },
    mediaPublicId: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkerPost', workerPostSchema);