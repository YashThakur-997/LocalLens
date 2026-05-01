const Job = require('../models/job.model');
const User = require('../models/user.model');

exports.createJob = async (req, res) => {
    try {
        const { workerId } = req.body;
        const clientId = req.user && req.user.id;

        if (!clientId || !workerId) {
            return res.status(400).json({ message: 'clientId and workerId are required' });
        }

        const client = await User.findById(clientId).select('role');
        const worker = await User.findById(workerId).select('role');

        if (!client || client.role !== 'client') {
            return res.status(403).json({ message: 'Only clients can create bookings' });
        }

        if (!worker || worker.role !== 'worker') {
            return res.status(404).json({ message: 'Worker not found' });
        }

        const newJob = await Job.create({
            client: clientId,
            worker: workerId,
            status: 'pending'
        });
        res.status(201).json(newJob);
    } catch (err) {
        res.status(500).send('Error creating booking');
    }
};

exports.getCurrentWork = async (req, res) => {
    try {
        const userId = req.user && req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('role');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const filter = user.role === 'worker'
            ? { worker: userId, status: 'accepted' }
            : { client: userId, status: 'accepted' };

        const currentWork = await Job.find(filter)
            .populate('client', 'username phone location')
            .populate('worker', 'username phone location workerProfile')
            .sort({ createdAt: -1 });

        return res.status(200).json({ currentWork });
    } catch (err) {
        console.error('Current work fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getClientBookings = async (req, res) => {
    try {
        const clientId = req.user && req.user.id;

        if (!clientId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const bookings = await Job.find({ client: clientId })
            .populate('worker', 'username location workerProfile')
            .sort({ createdAt: -1 });

        return res.status(200).json({ bookings });
    } catch (err) {
        console.error('Client bookings fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.getWorkerRequests = async (req, res) => {
    try {
        const workerId = req.user && req.user.id;

        if (!workerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const requests = await Job.find({ worker: workerId })
            .populate('client', 'username phone location')
            .sort({ createdAt: -1 });

        return res.status(200).json({ requests });
    } catch (err) {
        console.error('Worker requests fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const workerId = req.user && req.user.id;
        const { jobId } = req.params;
        const { action } = req.body;

        if (!workerId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'action must be accept or reject' });
        }

        const job = await Job.findOne({ _id: jobId, worker: workerId }).populate('client', 'username phone location');

        if (!job) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (job.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending bookings can be updated' });
        }

        job.status = action === 'accept' ? 'accepted' : 'cancelled';
        await job.save();

        return res.status(200).json({
            message: action === 'accept' ? 'Booking accepted' : 'Booking rejected',
            booking: job,
        });
    } catch (err) {
        console.error('Update booking status error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};