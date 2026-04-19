let jwt = require('jsonwebtoken');
let dotenv = require('dotenv');

dotenv.config();

let authMiddleware = (req, res, next) => {
    let token = req.headers['authorization'] || req.cookies?.token;

    // Strip "Bearer " if present
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }


    if (!token) {
        return res.status(401).send({ message: 'Access denied. No token provided.' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send({ message: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

module.exports = authMiddleware;
