const { verifyAccessToken } = require("../utils/jwt");
const AppError = require("../utils/AppError");

function authenticate(req, res, next) {
    const token = req.cookies?.accessToken;
    if (!token) return next(new AppError("Authentication required", 401));

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch (err) {
        next(new AppError("Invalid or expired session", 401));
    }
}

// Attaches req.user when a valid access token cookie is present, but never
// blocks the request — for routes with visibility that depends on identity
// (e.g. a published course is public, a draft is owner/admin-only).
function optionalAuthenticate(req, res, next) {
    const token = req.cookies?.accessToken;
    if (!token) return next();

    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, role: payload.role };
    } catch (err) {
        // invalid/expired token on an optional route — proceed as anonymous
    }
    next();
}

function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return next(new AppError("Authentication required", 401));
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", 403));
        }
        next();
    };
}

module.exports = { authenticate, authorize, optionalAuthenticate };
