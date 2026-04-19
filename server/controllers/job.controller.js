const Job = require('../models/job.model');
const User = require('../models/user.model');

exports.createJob = async (req, res) => {
    try {
        const { workerId, clientId: clientIdFromBody } = req.body;
        const clientId = (req.user && req.user.id) || clientIdFromBody;

        if (!clientId || !workerId) {
            return res.status(400).json({ message: 'clientId and workerId are required' });
        }

        const newJob = await Job.create({
            client: clientId,
            worker: workerId
        });
        res.status(201).json(newJob);
    } catch (err) {
        res.status(500).send('Error creating job');
    }
};