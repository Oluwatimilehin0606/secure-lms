const pool = require("../config/database");

const BASE_SELECT = `
    SELECT p.id, p.student_id, p.course_id, p.amount, p.status, p.reference, p.created_at, p.updated_at
    FROM payments p
`;

async function findByReference(reference) {
    const result = await pool.query(`${BASE_SELECT} WHERE p.reference = $1`, [reference]);
    return result.rows[0] || null;
}

async function findById(id) {
    const result = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
    return result.rows[0] || null;
}

async function findPendingForStudentCourse(studentId, courseId) {
    const result = await pool.query(
        `${BASE_SELECT} WHERE p.student_id = $1 AND p.course_id = $2 AND p.status = 'pending'
         ORDER BY p.created_at DESC LIMIT 1`,
        [studentId, courseId]
    );
    return result.rows[0] || null;
}

async function hasSuccessfulPayment(studentId, courseId) {
    const result = await pool.query(
        `SELECT 1 FROM payments WHERE student_id = $1 AND course_id = $2 AND status = 'successful' LIMIT 1`,
        [studentId, courseId]
    );
    return result.rowCount > 0;
}

async function create({ studentId, courseId, amount, reference }) {
    const result = await pool.query(
        `INSERT INTO payments (student_id, course_id, amount, reference)
         VALUES ($1, $2, $3, $4)
         RETURNING id, student_id, course_id, amount, status, reference, created_at, updated_at`,
        [studentId, courseId, amount, reference]
    );
    return result.rows[0];
}

async function markFailed(id) {
    const result = await pool.query(
        `UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'pending'
         RETURNING id, student_id, course_id, amount, status, reference, created_at, updated_at`,
        [id]
    );
    return result.rows[0] || null;
}

// Atomically transitions a pending payment to successful and ensures the student
// ends up actively enrolled, in one transaction -- a payment can never succeed
// without the enrollment it paid for (or vice versa), even on a partial failure.
async function markSuccessfulAndEnroll({ paymentId, studentId, courseId }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const paymentResult = await client.query(
            `UPDATE payments SET status = 'successful', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'pending'
             RETURNING id, student_id, course_id, amount, status, reference, created_at, updated_at`,
            [paymentId]
        );
        const payment = paymentResult.rows[0];
        if (!payment) {
            await client.query("ROLLBACK");
            return { status: "conflict" };
        }

        const existingResult = await client.query(
            `SELECT id, status FROM enrollments WHERE student_id = $1 AND course_id = $2 FOR UPDATE`,
            [studentId, courseId]
        );
        const existing = existingResult.rows[0];

        let enrollment;
        if (!existing) {
            const insertResult = await client.query(
                `INSERT INTO enrollments (student_id, course_id)
                 VALUES ($1, $2)
                 RETURNING id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at`,
                [studentId, courseId]
            );
            enrollment = insertResult.rows[0];
        } else if (existing.status !== "active") {
            const updateResult = await client.query(
                `UPDATE enrollments
                 SET status = 'active', enrolled_at = CURRENT_TIMESTAMP, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at`,
                [existing.id]
            );
            enrollment = updateResult.rows[0];
        } else {
            const currentResult = await client.query(
                `SELECT id, student_id, course_id, status, enrolled_at, completed_at, created_at, updated_at
                 FROM enrollments WHERE id = $1`,
                [existing.id]
            );
            enrollment = currentResult.rows[0];
        }

        await client.query("COMMIT");
        return { status: "ok", payment, enrollment };
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
    } finally {
        client.release();
    }
}

async function listForStudent(studentId, { status, limit, offset }) {
    const conditions = ["p.student_id = $1"];
    const params = [studentId];
    if (status) {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `SELECT p.id, p.student_id, p.course_id, p.amount, p.status, p.reference, p.created_at, p.updated_at,
                c.title AS course_title
         FROM payments p
         JOIN courses c ON c.id = p.course_id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM payments p ${whereClause}`, params);
    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

async function listAll({ status, studentId, courseId, limit, offset }) {
    const conditions = [];
    const params = [];
    if (status) {
        params.push(status);
        conditions.push(`p.status = $${params.length}`);
    }
    if (studentId) {
        params.push(studentId);
        conditions.push(`p.student_id = $${params.length}`);
    }
    if (courseId) {
        params.push(courseId);
        conditions.push(`p.course_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const listParams = [...params, limit, offset];
    const limitIdx = listParams.length - 1;
    const offsetIdx = listParams.length;

    const result = await pool.query(
        `SELECT p.id, p.student_id, p.course_id, p.amount, p.status, p.reference, p.created_at, p.updated_at,
                u.first_name AS student_first_name, u.last_name AS student_last_name, u.email AS student_email,
                c.title AS course_title
         FROM payments p
         JOIN users u ON u.id = p.student_id
         JOIN courses c ON c.id = p.course_id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        listParams
    );

    const countResult = await pool.query(`SELECT COUNT(*) FROM payments p ${whereClause}`, params);
    return { rows: result.rows, total: Number(countResult.rows[0].count) };
}

module.exports = {
    findByReference,
    findById,
    findPendingForStudentCourse,
    hasSuccessfulPayment,
    create,
    markFailed,
    markSuccessfulAndEnroll,
    listForStudent,
    listAll,
};
