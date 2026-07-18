const pool = require("../config/database");

async function findRoleByName(name) {
    const result = await pool.query("SELECT id, name FROM roles WHERE name = $1", [name]);
    return result.rows[0] || null;
}

module.exports = { findRoleByName };
