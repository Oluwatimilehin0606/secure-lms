const pool = require("../config/database");

const BASE_SELECT = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.email_verified,
           u.password_hash, u.is_active, u.failed_login_attempts, u.locked_until,
           u.last_login_at, u.deleted_at, u.role_id, r.name AS role
    FROM users u
    JOIN roles r ON r.id = u.role_id
`;

async function findByEmail(email) {
    const result = await pool.query(`${BASE_SELECT} WHERE u.email = $1 AND u.deleted_at IS NULL`, [email]);
    return result.rows[0] || null;
}

async function findById(id) {
    const result = await pool.query(`${BASE_SELECT} WHERE u.id = $1 AND u.deleted_at IS NULL`, [id]);
    return result.rows[0] || null;
}

async function createUser({ firstName, lastName, email, passwordHash, roleId }) {
    const result = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, first_name, last_name, email, email_verified, role_id`,
        [firstName, lastName, email, passwordHash, roleId]
    );
    return result.rows[0];
}

async function incrementFailedLoginAttempts(id) {
    const result = await pool.query(
        `UPDATE users SET failed_login_attempts = failed_login_attempts + 1
         WHERE id = $1
         RETURNING failed_login_attempts`,
        [id]
    );
    return result.rows[0].failed_login_attempts;
}

async function lockAccount(id, lockedUntil) {
    await pool.query("UPDATE users SET locked_until = $2 WHERE id = $1", [id, lockedUntil]);
}

async function resetLoginState(id) {
    await pool.query(
        `UPDATE users
         SET failed_login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
    );
}

async function listUsers({ role, search, limit, offset }) {
    const conditions = ["u.deleted_at IS NULL"];
    const params = [];

    if (role) {
        params.push(role);
        conditions.push(`r.name = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        conditions.push(
            `(u.email ILIKE $${params.length} OR u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length})`
        );
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.email_verified, u.is_active,
                u.failed_login_attempts, u.locked_until, u.last_login_at, u.created_at, r.name AS role
         FROM users u
         JOIN roles r ON r.id = u.role_id
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(
        `SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id ${whereClause}`,
        params
    );

    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

// Changes a user's role inside a transaction that locks the target row AND the
// full active-admin set in one query (ORDER BY id), so the last-admin check is
// race-free. Locking both sets in a single, identically-ordered query — rather
// than the target row followed by a separate admin-set query — matters: two
// concurrent demotions of two different admins would otherwise each hold one
// lock while waiting on the other (classic deadlock). Because every caller
// requests the same row set in the same id order, contention always resolves
// to a clean block-then-proceed instead of a cycle.
async function changeRole(targetId, newRoleId, newRoleName) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const lockResult = await client.query(
            `SELECT u.id, r.name AS role
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.deleted_at IS NULL
               AND (u.id = $1 OR (r.name = 'admin' AND u.is_active = TRUE))
             ORDER BY u.id
             FOR UPDATE OF u`,
            [targetId]
        );

        const targetRow = lockResult.rows.find((row) => row.id === targetId);
        if (!targetRow) {
            await client.query("ROLLBACK");
            return { status: "not_found" };
        }

        const previousRole = targetRow.role;

        if (previousRole === newRoleName) {
            await client.query("ROLLBACK");
            return { status: "same_role", previousRole };
        }

        if (previousRole === "admin" && newRoleName !== "admin") {
            const adminCount = lockResult.rows.filter((row) => row.role === "admin").length;
            if (adminCount <= 1) {
                await client.query("ROLLBACK");
                return { status: "last_admin", previousRole };
            }
        }

        await client.query("UPDATE users SET role_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [
            targetId,
            newRoleId,
        ]);
        await client.query("COMMIT");

        return { status: "ok", previousRole };
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    findByEmail,
    findById,
    createUser,
    incrementFailedLoginAttempts,
    lockAccount,
    resetLoginState,
    listUsers,
    changeRole,
};
