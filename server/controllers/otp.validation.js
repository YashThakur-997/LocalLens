const Job = require('../models/job.model');
const User = require('../models/user.model');

const requestCompletion = async (req, res) => {
    const { jobId } = req.params;
    // Generate 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

    try {
        const job = await Job.findByIdAndUpdate(jobId, { otp: generatedOtp }, { new: true });
        if (!job) {
            return res.status(404).send('Job not found');
        }
        // In a real app, you'd send this via SMS to the Client's phone
        res.status(200).json({ message: "OTP sent to client", debugOtp: generatedOtp });
    } catch (err) {
        res.status(500).send('Handshake failed');
    }
};

const verifyAndRate = async (req, res) => {
    const { jobId, otp, rating, comment } = req.body;

    try {
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).send('Job not found');
        if (job.otp !== otp) return res.status(401).send('Invalid OTP');

        // 1. Update Job Status
        job.status = 'completed';
        job.review = { rating, comment };
        await job.save();

        // 2. Update Worker's Global Rating (Average)
        const worker = await User.findById(job.worker);
        if (!worker) return res.status(404).send('Worker not found');

        if (!worker.workerProfile) {
            worker.workerProfile = {};
        }
        const totalJobs = worker.workerProfile.jobsCompleted + 1;
        const oldRatingTotal = worker.workerProfile.rating * worker.workerProfile.jobsCompleted;
        
        worker.workerProfile.rating = (oldRatingTotal + rating) / totalJobs;
        worker.workerProfile.jobsCompleted = totalJobs;
        await worker.save();

        res.status(200).send('Job verified and rating updated!');
    } catch (err) {
        res.status(500).send('Verification error');
    }
};

module.exports = {
    requestCompletion,
    verifyAndRate
}