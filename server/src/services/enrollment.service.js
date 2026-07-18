const AppError = require("../utils/AppError");
const courseModel = require("../models/course.model");
const enrollmentModel = require("../models/enrollment.model");
const paymentModel = require("../models/payment.model");
const auditLogModel = require("../models/auditLog.model");
const { parsePagination } = require("../utils/pagination");

function isCourseOwnerOrAdmin(user, course) {
    return user.role === "admin" || (user.role === "instructor" && user.id === course.instructor_id);
}

function paginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function enroll(courseId, student) {
    const course = await courseModel.findById(courseId);
    if (!course || course.status !== "published") {
        throw new AppError("Course not found", 404);
    }

    if (Number(course.price) > 0) {
        const alreadyPaid = await paymentModel.hasSuccessfulPayment(student.id, courseId);
        if (!alreadyPaid) {
            throw new AppError("This course requires payment before enrolling", 402);
        }
    }

    const existing = await enrollmentModel.findByStudentAndCourse(student.id, courseId);

    if (existing) {
        if (existing.status === "active") {
            throw new AppError("You are already enrolled in this course", 409);
        }
        if (existing.status === "completed") {
            throw new AppError("You have already completed this course", 409);
        }

        const reactivated = await enrollmentModel.reactivate(existing.id);
        await auditLogModel.log({
            actorUserId: student.id,
            action: "enrollment_reactivated",
            entityType: "enrollment",
            entityId: reactivated.id,
            details: { courseId },
        });
        return reactivated;
    }

    const enrollment = await enrollmentModel.create({ studentId: student.id, courseId });
    await auditLogModel.log({
        actorUserId: student.id,
        action: "enrollment_created",
        entityType: "enrollment",
        entityId: enrollment.id,
        details: { courseId },
    });
    return enrollment;
}

async function listMyEnrollments(student, query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await enrollmentModel.listForStudent(student.id, {
        status: query.status,
        limit,
        offset,
    });
    return { enrollments: rows, pagination: paginationMeta(page, limit, total) };
}

async function listCourseRoster(courseId, user, query) {
    const course = await courseModel.findById(courseId);
    if (!course) throw new AppError("Course not found", 404);
    if (!isCourseOwnerOrAdmin(user, course)) {
        throw new AppError("You do not have permission to view this course's roster", 403);
    }

    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await enrollmentModel.listForCourse(courseId, {
        status: query.status,
        limit,
        offset,
    });
    return { enrollments: rows, pagination: paginationMeta(page, limit, total) };
}

async function cancel(enrollmentId, user) {
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) throw new AppError("Enrollment not found", 404);

    const isSelf = user.role === "student" && user.id === enrollment.student_id;
    if (!isSelf && user.role !== "admin") {
        throw new AppError("You do not have permission to cancel this enrollment", 403);
    }
    if (enrollment.status !== "active") {
        throw new AppError(`Enrollment is already ${enrollment.status}`, 409);
    }

    const updated = await enrollmentModel.updateStatus(enrollmentId, "cancelled");

    await auditLogModel.log({
        actorUserId: user.id,
        action: "enrollment_cancelled",
        entityType: "enrollment",
        entityId: enrollmentId,
    });

    return updated;
}

async function complete(enrollmentId, user) {
    const enrollment = await enrollmentModel.findById(enrollmentId);
    if (!enrollment) throw new AppError("Enrollment not found", 404);

    const course = await courseModel.findById(enrollment.course_id);
    if (!course || !isCourseOwnerOrAdmin(user, course)) {
        throw new AppError("You do not have permission to complete this enrollment", 403);
    }
    if (enrollment.status !== "active") {
        throw new AppError(`Enrollment is already ${enrollment.status}`, 409);
    }

    const updated = await enrollmentModel.updateStatus(enrollmentId, "completed", { completed: true });

    await auditLogModel.log({
        actorUserId: user.id,
        action: "enrollment_completed",
        entityType: "enrollment",
        entityId: enrollmentId,
    });

    return updated;
}

module.exports = { enroll, listMyEnrollments, listCourseRoster, cancel, complete };
