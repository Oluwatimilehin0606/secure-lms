const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAccessToken({ userId, role }) {
    return jwt.sign({ sub: userId, role }, env.jwt.accessSecret, {
        expiresIn: env.jwt.accessExpiresIn,
    });
}

function verifyAccessToken(token) {
    return jwt.verify(token, env.jwt.accessSecret);
}

function generateRefreshToken() {
    const token = crypto.randomBytes(64).toString("hex");
    const tokenHash = hashToken(token);
    return { token, tokenHash };
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
    signAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    hashToken,
};
