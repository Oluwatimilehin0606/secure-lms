const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const message = errors
        .array({ onlyFirstError: true })
        .map((err) => err.msg)
        .join("; ");

    next(new AppError(message, 400));
}

module.exports = validate;
