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
            username: user.username
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
            payload.workerProfile = workerProfile || {};
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

module.exports = {
    login_handler,
    signup_handler,
    logout_handler
};
