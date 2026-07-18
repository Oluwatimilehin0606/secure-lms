const pool = require("../config/database");

const BASE_SELECT = `
    SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at, e.completed_at,
           e.created_at, e.updated_at
    FROM enrollments e
`;

async function findByStudentAndCourse(studentId, courseId) {
    const result = await pool.query(`${BASE_SELECT} WHERE e.student_id = $1 AND e.course_id = $2`, [
        studentId,
        courseId,
    ]);
    return result.rows[0] || null;
}

async function findById(id) {
    const result = await pool.query(`${BASE_SELECT} WHERE e.id = $1`, [id]);
    return result.rows[0] || null;
}

async function create({ studentId, courseId }) {
    const result = await pool.query(
        `INSERT INTO enrollments (student_id, course_id)
         VALUES ($1, $2)
         RETURNING id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at`,
        [studentId, courseId]
    );
    return result.rows[0];
}

async function reactivate(id) {
    const result = await pool.query(
        `UPDATE enrollments
         SET status = 'active', enrolled_at = CURRENT_TIMESTAMP, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at`,
        [id]
    );
    return result.rows[0];
}

async function updateStatus(id, status, { completed = false } = {}) {
    const result = await pool.query(
        `UPDATE enrollments
         SET status = $2,
             completed_at = CASE WHEN $3 THEN CURRENT_TIMESTAMP ELSE completed_at END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at`,
        [id, status, completed]
    );
    return result.rows[0] || null;
}

async function listForStudent(studentId, { status, limit, offset }) {
    const conditions = ["e.student_id = $1"];
    const params = [studentId];

    if (status) {
        params.push(status);
        conditions.push(`e.status = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at, e.completed_at, e.created_at, e.updated_at,
                c.title AS course_title, c.price AS course_price
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM enrollments e ${whereClause}`, params);

    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

async function listForCourse(courseId, { status, limit, offset }) {
    const conditions = ["e.course_id = $1"];
    const params = [courseId];

    if (status) {
        params.push(status);
        conditions.push(`e.status = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `SELECT e.id, e.student_id, e.course_id, e.status, e.enrolled_at, e.completed_at, e.created_at, e.updated_at,
                u.first_name AS student_first_name, u.last_name AS student_last_name, u.email AS student_email
         FROM enrollments e
         JOIN users u ON u.id = e.student_id
         ${whereClause}
         ORDER BY e.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM enrollments e ${whereClause}`, params);

    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

async function countActiveForCourse(courseId) {
    const result = await pool.query(
        `SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND status = 'active'`,
        [courseId]
    );
    return Number(result.rows[0].count);
}

module.exports = {
    findByStudentAndCourse,
    findById,
    create,
    reactivate,
    updateStatus,
    listForStudent,
    listForCourse,
    countActiveForCourse,
};
