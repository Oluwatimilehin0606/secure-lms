const argon2 = require("argon2");

function hashPassword(plainPassword) {
    return argon2.hash(plainPassword, { type: argon2.argon2id });
}

function verifyPassword(hash, plainPassword) {
    return argon2.verify(hash, plainPassword);
}

module.exports = { hashPassword, verifyPassword };
