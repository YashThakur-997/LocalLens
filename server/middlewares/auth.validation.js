let joi = require('joi');

const signupvalidation = (req, res, next) => {
    let signupSchema = joi.object({
        username: joi.string().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(30).required(), // Changed from pattern
        phone: joi.string().min(10).max(15).required(),
        role: joi.string().valid('client', 'worker').default('client').required(),
        workerProfile: joi.when('role', {
            is: 'worker',
            then: joi.object({
                category: joi.string().trim().min(1).required(),
                videoUrl: joi.string().uri().allow('', null),
                rating: joi.number().min(0),
                jobsCompleted: joi.number().min(0),
                isAvailable: joi.boolean()
            }).required(),
            otherwise: joi.object({
                category: joi.string().allow('', null),
                videoUrl: joi.string().uri().allow('', null),
                rating: joi.number().min(0),
                jobsCompleted: joi.number().min(0),
                isAvailable: joi.boolean()
            }).optional()
        }),
        location: joi.object({
            type: joi.string().valid('Point').default('Point'),
            coordinates: joi.array().items(joi.number()).length(2).required()
        }).required()
    });
    const error = signupSchema.validate(req.body).error;
    if (error) {
        return res.status(400).send({
            message: error.details[0].message || 'Validation failed'
        });
    };
    next();
};

const loginvalidation = (req, res, next) => {
    let loginSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().min(6).max(30).required() // Changed from pattern
    });
    const error = loginSchema.validate(req.body).error;
    if (error) {
        return res.status(400).send({
            message: error.details[0].message
        });
    };
    next();
};

module.exports = {
    signupvalidation,
    loginvalidation
}
