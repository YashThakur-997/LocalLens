const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema({
  category: { type: String }, // e.g., 'Plumber'
  videoUrl: { type: String },
  rating: { type: Number, default: 0 },
  jobsCompleted: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true , unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['client', 'worker'], 
    default: 'client' 
  },
  // Worker-specific fields (optional if role is client)
  workerProfile: { type: workerProfileSchema, default: undefined },
  // Shared Location for both discovery and booking
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  serviceHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  profilePictureUrl: { type: String },
  profilePicturePublicId: { type: String }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);