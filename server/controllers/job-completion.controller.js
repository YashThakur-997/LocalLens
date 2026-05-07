const Job = require('../models/job.model');
const User = require('../models/user.model');

const requestCompletion = async (req, res) => {
    const { jobId } = req.params;
    const workerId = req.user?.id;

    try {
        if (!workerId) {
            return res.status(401).json({ message: 'Unauthorized - Worker ID not found' });
        }

        const job = await Job.findOne({ _id: jobId, worker: workerId });
        if (!job) {
            // Check if job exists at all (for better error message)
            const jobExists = await Job.findById(jobId);
            if (!jobExists) {
                return res.status(404).json({ message: 'Job not found' });
            }
            return res.status(403).json({ message: 'You are not assigned to this job' });
        }

        if (job.status === 'completed') {
            return res.status(200).json({
                message: 'Job is already completed.',
                status: job.status,
            });
        }

        // If already completion_pending, return success (idempotent)
        if (job.status === 'completion_pending') {
            return res.status(200).json({
                message: 'Job already marked as pending completion. Waiting for client review.',
                status: job.status,
            });
        }

        if (job.status !== 'accepted') {
            return res.status(400).json({
                message: `Only accepted jobs can be marked as completed. Current status: ${job.status}`,
            });
        }

        const now = new Date();
        job.status = 'completion_pending';
        job.completionRequestedAt = now;
        await job.save();

        return res.status(200).json({
            message: 'Job marked as completed. Waiting for client review.',
            status: job.status,
        });
    } catch (err) {
        console.error('Completion request error:', err);
        return res.status(500).json({ message: 'Unable to mark completion right now.' });
    }
};

const markNotComplete = async (req, res) => {
    const { jobId } = req.params;
    const clientId = req.user?.id;

    try {
        const job = await Job.findOne({ _id: jobId, client: clientId });
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        if (job.status !== 'completion_pending') {
            return res.status(400).json({
                message: 'Only pending completions can be rejected.',
            });
        }

        job.status = 'accepted';
        job.completionRequestedAt = undefined;
        await job.save();

        return res.status(200).json({
            message: 'Marked as not complete. Worker has been notified.',
            status: job.status,
        });
    } catch (err) {
        console.error('Mark not complete error:', err);
        return res.status(500).json({ message: 'Unable to reject completion right now.' });
    }
};

const verifyAndRate = async (req, res) => {
    const { jobId, rating, comment } = req.body;
    const clientId = req.user?.id;

    try {
        const parsedRating = Number(rating);
        const normalizedComment = typeof comment === 'string' ? comment.trim() : '';

        if (!jobId || Number.isNaN(parsedRating)) {
            return res.status(400).json({ message: 'jobId and rating are required.' });
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

        if (job.status !== 'completion_pending') {
            return res.status(400).json({
                message: 'Worker has not marked completion yet.',
            });
        }

        // 1. Update Job Status
        job.status = 'completed';
        job.review = { rating: parsedRating, comment: normalizedComment };
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
    markNotComplete,
    verifyAndRate
}
