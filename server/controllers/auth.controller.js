const UserModel = require('../models/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

const jwt = require('jsonwebtoken');

const login_handler = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email: email });
        if (!user) {
            return res.status(404).send('User not found');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // res.send({ message: 'Login successful', token: token });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });
        res.status(200).send({
            message: 'Login successful',
            token,
            username: user.username,
            role: user.role
        });

    }
    catch (err) {
        res.status(500).send('Internal Server Error',err);
    }
}

const signup_handler = async (req, res) => {
    try {
        const { username, email, password, phone, role, location, workerProfile } = req.body;

        const existingUser = await UserModel.findOne({ email: email });
        if (existingUser) {
            return res.status(409).send('User already exists');
        }
        const normalizedRole = role || 'client';
        const payload = { username, email, password, phone, role: normalizedRole, location };

        if (normalizedRole === 'worker') {
            payload.workerProfile = {
                ...(workerProfile || {}),
                category: workerProfile?.category?.trim(),
            };
        }

        const newUser = new UserModel(payload);
        newUser.password = await bcrypt.hash(password, 10);
        await newUser.save();
        res.status(201).send('User registered successfully');
    }
    catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation failed',
                details: Object.values(err.errors).map((e) => e.message)
            });
        }

        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Duplicate field value',
                details: err.keyValue
            });
        }

        console.error('Signup error:', err);
        res.status(500).send('Internal Server Error');
    }
}

const logout_handler = (req, res) => {
    res.clearCookie('token');
    res.clearCookie('Authorization');
    res.redirect('/login');
};

const search_workers_handler = async (req, res) => {
    try {
        const {
            q = "",
            category = "all",
            availability = "all",
            minRating = "0",
        } = req.query;

        const query = {
            role: 'worker',
        };

        if (availability === 'available') {
            query['workerProfile.isAvailable'] = true;
        } else if (availability === 'unavailable') {
            query['workerProfile.isAvailable'] = false;
        }

        if (category && category !== 'all') {
            query['workerProfile.category'] = new RegExp(category, 'i');
        }

        if (q) {
            query.$or = [
                { username: new RegExp(q, 'i') },
                { email: new RegExp(q, 'i') },
                { 'workerProfile.category': new RegExp(q, 'i') },
            ];
        }

        const workers = await UserModel.find(query)
            .select('username role location workerProfile')
            .sort({ 'workerProfile.rating': -1, 'workerProfile.jobsCompleted': -1, createdAt: -1 });

        const filteredWorkers = workers
            .map((worker) => {
                const rating = worker.workerProfile?.rating ?? 0;
                const jobsCompleted = worker.workerProfile?.jobsCompleted ?? 0;

                return {
                    id: worker._id,
                    name: worker.username,
                    rating,
                    jobsCompleted,
                    category: worker.workerProfile?.category ?? 'General electrician',
                    isAvailable: worker.workerProfile?.isAvailable ?? true,
                    area: worker.location?.coordinates?.length === 2
                        ? `${worker.location.coordinates[1].toFixed(4)}, ${worker.location.coordinates[0].toFixed(4)}`
                        : 'Area not set',
                    location: worker.location,
                    workerProfile: worker.workerProfile,
                };
            })
            .filter((worker) => worker.rating >= Number(minRating || 0));

        return res.status(200).json({ workers: filteredWorkers });
    }
    catch (err) {
        console.error('Worker search error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const get_worker_handler = async (req, res) => {
    try {
        const { workerId } = req.params;

        const worker = await UserModel.findOne({ _id: workerId, role: 'worker' })
            .select('username email phone role location workerProfile createdAt');

        if (!worker) {
            return res.status(404).json({ message: 'Worker not found' });
        }

        return res.status(200).json({ worker });
    }
    catch (err) {
        console.error('Worker profile fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const profile_handler = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await UserModel.findById(userId).select('username email phone role location workerProfile createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    }
    catch (err) {
        console.error('Profile fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

const update_worker_availability_handler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { isAvailable } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const worker = await UserModel.findById(userId);

        if (!worker) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (worker.role !== 'worker') {
            return res.status(403).json({ message: 'Only workers can update availability' });
        }

        if (!worker.workerProfile) {
            worker.workerProfile = {};
        }

        worker.workerProfile.isAvailable = Boolean(isAvailable);
        await worker.save();

        return res.status(200).json({
            message: 'Availability updated successfully',
            isAvailable: worker.workerProfile.isAvailable,
        });
    }
    catch (err) {
        console.error('Availability update error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    login_handler,
    signup_handler,
    logout_handler,
    search_workers_handler,
    get_worker_handler,
    profile_handler,
    update_worker_availability_handler,
};
