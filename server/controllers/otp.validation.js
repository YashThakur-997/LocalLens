const Job = require('../models/job.model');
const User = require('../models/user.model');
const crypto = require('crypto');

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const hashOtp = (otp) => {
    const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
    return crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex');
};

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const requestCompletion = async (req, res) => {
    const { jobId } = req.params;
    const workerId = req.user?.id;

    try {
        const job = await Job.findOne({ _id: jobId, worker: workerId });
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status === 'completed') {
            return res.status(200).json({
                message: 'Job is already completed and verified.',
                status: job.status,
            });
        }

        if (!['accepted', 'completion_requested'].includes(job.status)) {
            return res.status(400).json({
                message: 'Only accepted jobs can request completion verification.',
            });
        }

        const now = new Date();
        const otpStillValid = job.status === 'completion_requested'
            && job.otpHash
            && job.otpExpiresAt
            && job.otpExpiresAt > now;

        if (otpStillValid) {
            return res.status(200).json({
                message: 'Completion already requested. Ask the client to verify before OTP expiry.',
                status: job.status,
                otpExpiresAt: job.otpExpiresAt,
            });
        }

        const generatedOtp = generateOtp();
        const otpExpiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

        job.otpHash = hashOtp(generatedOtp);
        job.otpExpiresAt = otpExpiresAt;
        job.completionRequestedAt = now;
        job.otpVerificationAttempts = 0;
        job.status = 'completion_requested';
        await job.save();

        // TODO: Replace direct OTP return with secure delivery (SMS/push/email).
        return res.status(200).json({
            message: 'Completion OTP generated. Share this OTP with the client for verification.',
            status: job.status,
            otpExpiresAt,
            otp: generatedOtp,
        });
    } catch (err) {
        console.error('Completion request error:', err);
        return res.status(500).json({ message: 'Unable to request completion right now.' });
    }
};

const verifyAndRate = async (req, res) => {
    const { jobId, otp, rating, comment } = req.body;
    const clientId = req.user?.id;

    try {
        const parsedRating = Number(rating);
        const normalizedComment = typeof comment === 'string' ? comment.trim() : '';

        if (!jobId || !otp || Number.isNaN(parsedRating)) {
            return res.status(400).json({ message: 'jobId, otp, and rating are required.' });
        }

        if (parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const job = await Job.findOne({ _id: jobId, client: clientId });

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status === 'completed') {
            return res.status(200).json({
                message: 'Job is already verified and completed.',
                status: job.status,
            });
        }

        if (job.status !== 'completion_requested') {
            return res.status(400).json({
                message: 'Worker has not requested completion verification yet.',
            });
        }

        if (!job.otpHash || !job.otpExpiresAt) {
            return res.status(400).json({ message: 'Completion OTP is not available for this job.' });
        }

        const now = new Date();

        if (job.otpExpiresAt <= now) {
            return res.status(400).json({
                message: 'OTP has expired. Ask the worker to request completion again.',
            });
        }

        if ((job.otpVerificationAttempts || 0) >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({
                message: 'Too many invalid OTP attempts. Ask the worker to generate a new OTP.',
            });
        }

        const otpMatches = hashOtp(String(otp).trim()) === job.otpHash;

        if (!otpMatches) {
            job.otpVerificationAttempts = (job.otpVerificationAttempts || 0) + 1;
            await job.save();
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        // 1. Update Job Status
        job.status = 'completed';
        job.review = { rating: parsedRating, comment: normalizedComment };
        job.otpHash = undefined;
        job.otpExpiresAt = undefined;
        job.otpVerificationAttempts = 0;
        await job.save();

        // 2. Update Worker's Global Rating (Average)
        const worker = await User.findById(job.worker);
        if (!worker) return res.status(404).json({ message: 'Worker not found' });

        if (!worker.workerProfile) {
            worker.workerProfile = {};
        }
        const completedJobs = Number(worker.workerProfile.jobsCompleted || 0);
        const currentRating = Number(worker.workerProfile.rating || 0);
        const totalJobs = completedJobs + 1;
        const oldRatingTotal = currentRating * completedJobs;
        
        worker.workerProfile.rating = (oldRatingTotal + parsedRating) / totalJobs;
        worker.workerProfile.jobsCompleted = totalJobs;
        await worker.save();

        return res.status(200).json({
            message: 'Job verified and rating updated!',
            status: job.status,
        });
    } catch (err) {
        console.error('Verification error:', err);
        return res.status(500).json({ message: 'Unable to verify and rate this job right now.' });
    }
};

module.exports = {
    requestCompletion,
    verifyAndRate
}