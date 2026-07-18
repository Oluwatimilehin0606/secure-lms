const env = require("../config/env");
const AppError = require("../utils/AppError");

function notFoundHandler(req, res) {
    res.status(404).json({ status: "error", message: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const isOperational = err instanceof AppError;
    const statusCode = isOperational ? err.statusCode : 500;

    if (!isOperational) {
        console.error(err);
    }

    res.status(statusCode).json({
        status: "error",
        message: isOperational ? err.message : "Something went wrong",
        ...(env.nodeEnv === "development" && !isOperational ? { stack: err.stack } : {}),
    });
}

module.exports = { notFoundHandler, errorHandler };
