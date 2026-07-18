const pool = require("../config/database");

async function create({ userId, familyId, tokenHash, expiresAt, ipAddress, userAgent }) {
    const result = await pool.query(
        `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, family_id`,
        [userId, familyId, tokenHash, expiresAt, ipAddress, userAgent]
    );
    return result.rows[0];
}

async function findByHash(tokenHash) {
    const result = await pool.query("SELECT * FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    return result.rows[0] || null;
}

async function revokeById(id) {
    await pool.query("UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
}

async function revokeFamily(familyId) {
    await pool.query(
        "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE family_id = $1 AND revoked_at IS NULL",
        [familyId]
    );
}

async function revokeAllForUser(userId) {
    await pool.query(
        "UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL",
        [userId]
    );
}

module.exports = { create, findByHash, revokeById, revokeFamily, revokeAllForUser };
