const crypto = require("crypto");
const AppError = require("../utils/AppError");
const courseModel = require("../models/course.model");
const paymentModel = require("../models/payment.model");
const auditLogModel = require("../models/auditLog.model");
const { parsePagination } = require("../utils/pagination");

function paginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function generateReference() {
    return `PAY-${crypto.randomBytes(10).toString("hex").toUpperCase()}`;
}

async function initiate(student, courseId) {
    const course = await courseModel.findById(courseId);
    if (!course || course.status !== "published") {
        throw new AppError("Course not found", 404);
    }

    if (Number(course.price) <= 0) {
        throw new AppError("This course is free and does not require payment", 400);
    }

    const alreadyPaid = await paymentModel.hasSuccessfulPayment(student.id, courseId);
    if (alreadyPaid) {
        throw new AppError("You have already paid for this course", 409);
    }

    const existingPending = await paymentModel.findPendingForStudentCourse(student.id, courseId);
    if (existingPending) {
        return existingPending;
    }

    const payment = await paymentModel.create({
        studentId: student.id,
        courseId,
        amount: course.price,
        reference: generateReference(),
    });

    await auditLogModel.log({
        actorUserId: student.id,
        action: "payment_initiated",
        entityType: "payment",
        entityId: payment.id,
        details: { courseId, amount: payment.amount },
    });

    return payment;
}

// Stands in for a payment gateway's callback/redirect. In this simulation the
// student (or an admin) reports the outcome directly rather than a signed
// webhook, since there's no real gateway behind it.
async function confirm(reference, outcome, actingUser) {
    const payment = await paymentModel.findByReference(reference);
    if (!payment) throw new AppError("Payment not found", 404);

    const isOwner = actingUser.id === payment.student_id;
    if (!isOwner && actingUser.role !== "admin") {
        throw new AppError("You do not have permission to confirm this payment", 403);
    }

    if (payment.status !== "pending") {
        throw new AppError(`Payment has already been ${payment.status}`, 409);
    }

    if (outcome === "failure") {
        const failed = await paymentModel.markFailed(payment.id);
        if (!failed) throw new AppError("Payment has already been processed", 409);

        await auditLogModel.log({
            actorUserId: actingUser.id,
            action: "payment_failed",
            entityType: "payment",
            entityId: payment.id,
        });

        return { payment: failed, enrollment: null };
    }

    const result = await paymentModel.markSuccessfulAndEnroll({
        paymentId: payment.id,
        studentId: payment.student_id,
        courseId: payment.course_id,
    });

    if (result.status === "conflict") {
        throw new AppError("Payment has already been processed", 409);
    }

    await auditLogModel.log({
        actorUserId: actingUser.id,
        action: "payment_succeeded",
        entityType: "payment",
        entityId: payment.id,
        details: { courseId: payment.course_id, enrollmentId: result.enrollment.id },
    });

    return { payment: result.payment, enrollment: result.enrollment };
}

async function getPayment(id, actingUser) {
    const payment = await paymentModel.findById(id);
    if (!payment) throw new AppError("Payment not found", 404);

    const isOwner = actingUser.id === payment.student_id;
    if (!isOwner && actingUser.role !== "admin") {
        // 404 rather than 403 so a payment's existence isn't leaked to non-owners.
        throw new AppError("Payment not found", 404);
    }

    return payment;
}

async function listMyPayments(student, query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await paymentModel.listForStudent(student.id, { status: query.status, limit, offset });
    return { payments: rows, pagination: paginationMeta(page, limit, total) };
}

async function listAllPayments(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await paymentModel.listAll({
        status: query.status,
        studentId: query.studentId,
        courseId: query.courseId,
        limit,
        offset,
    });
    return { payments: rows, pagination: paginationMeta(page, limit, total) };
}

module.exports = { initiate, confirm, getPayment, listMyPayments, listAllPayments };
