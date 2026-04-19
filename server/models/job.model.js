const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    otp: { type: String }, // Generated when worker clicks "Job Done"
    review: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String }
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] } // Where the job was actually done
    }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);