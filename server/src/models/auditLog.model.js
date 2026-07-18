const pool = require("../config/database");

async function log({ actorUserId = null, action, entityType = null, entityId = null, details = null }) {
    await pool.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [actorUserId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
}

module.exports = { log };
