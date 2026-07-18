const crypto = require("crypto");
const AppError = require("../utils/AppError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Stateless double-submit cookie check: the csrfToken cookie is readable by
// same-origin JS (not httpOnly), so a legitimate client can echo its value
// back in the X-CSRF-Token header. A cross-site attacker can trigger a
// cookie-bearing request but, blocked by the browser's same-origin policy,
// cannot read the cookie value to produce a matching header.
function verifyCsrf(req, res, next) {
    if (SAFE_METHODS.has(req.method)) return next();

    const cookieToken = req.cookies?.csrfToken;
    const headerToken = req.get("X-CSRF-Token");

    if (!cookieToken || !headerToken) {
        return next(new AppError("Missing CSRF token", 403));
    }

    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    const valid = cookieBuf.length === headerBuf.length && crypto.timingSafeEqual(cookieBuf, headerBuf);

    if (!valid) {
        return next(new AppError("Invalid CSRF token", 403));
    }

    next();
}

module.exports = verifyCsrf;
