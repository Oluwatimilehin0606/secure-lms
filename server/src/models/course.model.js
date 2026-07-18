const pool = require("../config/database");

const BASE_SELECT = `
    SELECT c.id, c.instructor_id, c.title, c.description, c.price, c.status,
           c.created_at, c.updated_at,
           u.first_name AS instructor_first_name, u.last_name AS instructor_last_name
    FROM courses c
    JOIN users u ON u.id = c.instructor_id
`;

const UPDATABLE_FIELDS = ["title", "description", "price"];

async function createCourse({ instructorId, title, description, price }) {
    const result = await pool.query(
        `INSERT INTO courses (instructor_id, title, description, price)
         VALUES ($1, $2, $3, $4)
         RETURNING id, instructor_id, title, description, price, status, created_at, updated_at`,
        [instructorId, title, description, price ?? 0]
    );
    return result.rows[0];
}

async function findById(id) {
    const result = await pool.query(`${BASE_SELECT} WHERE c.id = $1 AND c.deleted_at IS NULL`, [id]);
    return result.rows[0] || null;
}

async function listCourses({ status, instructorId, search, limit, offset }) {
    const conditions = ["c.deleted_at IS NULL"];
    const params = [];

    if (status) {
        params.push(status);
        conditions.push(`c.status = $${params.length}`);
    }
    if (instructorId) {
        params.push(instructorId);
        conditions.push(`c.instructor_id = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        conditions.push(`c.title ILIKE $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `${BASE_SELECT} ${whereClause} ORDER BY c.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM courses c ${whereClause}`, params);

    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

async function updateCourse(id, fields) {
    const setClauses = [];
    const params = [];

    for (const key of UPDATABLE_FIELDS) {
        if (fields[key] !== undefined) {
            params.push(fields[key]);
            setClauses.push(`${key} = $${params.length}`);
        }
    }

    if (setClauses.length === 0) return findById(id);

    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const result = await pool.query(
        `UPDATE courses SET ${setClauses.join(", ")}
         WHERE id = $${params.length} AND deleted_at IS NULL
         RETURNING id, instructor_id, title, description, price, status, created_at, updated_at`,
        params
    );
    return result.rows[0] || null;
}

async function updateStatus(id, status) {
    const result = await pool.query(
        `UPDATE courses SET status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, instructor_id, title, description, price, status, created_at, updated_at`,
        [id, status]
    );
    return result.rows[0] || null;
}

async function softDelete(id) {
    await pool.query(
        `UPDATE courses SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
    );
}

module.exports = {
    createCourse,
    findById,
    listCourses,
    updateCourse,
    updateStatus,
    softDelete,
};
