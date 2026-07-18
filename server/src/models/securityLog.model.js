const pool = require("../config/database");

async function log({ userId = null, eventType, description = null, ipAddress = null, userAgent = null, severity = "info", success = null }) {
    await pool.query(
        `INSERT INTO security_logs (user_id, event_type, description, ip_address, user_agent, severity, success)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, eventType, description, ipAddress, userAgent, severity, success]
    );
}

module.exports = { log };
