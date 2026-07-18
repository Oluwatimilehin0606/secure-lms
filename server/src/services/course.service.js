const AppError = require("../utils/AppError");
const courseModel = require("../models/course.model");
const enrollmentModel = require("../models/enrollment.model");
const auditLogModel = require("../models/auditLog.model");
const { parsePagination } = require("../utils/pagination");

function isOwnerOrAdmin(user, course) {
    return user.role === "admin" || (user.role === "instructor" && user.id === course.instructor_id);
}

function paginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function createCourse(user, data) {
    const course = await courseModel.createCourse({
        instructorId: user.id,
        title: data.title,
        description: data.description,
        price: data.price,
    });

    await auditLogModel.log({
        actorUserId: user.id,
        action: "course_created",
        entityType: "course",
        entityId: course.id,
    });

    return course;
}

async function getCourse(id, user) {
    const course = await courseModel.findById(id);
    if (!course) throw new AppError("Course not found", 404);

    // Drafts/archived courses are only visible to their owning instructor or an admin;
    // everyone else gets a 404 rather than a 403 so unpublished courses don't leak existence.
    if (course.status !== "published" && !(user && isOwnerOrAdmin(user, course))) {
        throw new AppError("Course not found", 404);
    }

    return course;
}

async function listCourses(user, query) {
    const { page, limit, offset } = parsePagination(query);
    const filters = { limit, offset, search: query.search, instructorId: query.instructorId };

    filters.status = user && user.role === "admin" && query.status ? query.status : "published";

    const { rows, total } = await courseModel.listCourses(filters);
    return { courses: rows, pagination: paginationMeta(page, limit, total) };
}

async function listMyCourses(user, query) {
    const { page, limit, offset } = parsePagination(query);
    const filters = { limit, offset, instructorId: user.id, status: query.status };

    const { rows, total } = await courseModel.listCourses(filters);
    return { courses: rows, pagination: paginationMeta(page, limit, total) };
}

async function updateCourse(id, user, data) {
    const course = await courseModel.findById(id);
    if (!course) throw new AppError("Course not found", 404);
    if (!isOwnerOrAdmin(user, course)) {
        throw new AppError("You do not have permission to modify this course", 403);
    }

    const updated = await courseModel.updateCourse(id, {
        title: data.title,
        description: data.description,
        price: data.price,
    });

    await auditLogModel.log({
        actorUserId: user.id,
        action: "course_updated",
        entityType: "course",
        entityId: id,
        details: data,
    });

    return updated;
}

async function setStatus(id, user, status) {
    const course = await courseModel.findById(id);
    if (!course) throw new AppError("Course not found", 404);
    if (!isOwnerOrAdmin(user, course)) {
        throw new AppError("You do not have permission to modify this course", 403);
    }
    if (course.status === status) {
        throw new AppError(`Course is already ${status}`, 409);
    }

    const updated = await courseModel.updateStatus(id, status);

    await auditLogModel.log({
        actorUserId: user.id,
        action: status === "published" ? "course_published" : "course_archived",
        entityType: "course",
        entityId: id,
    });

    return updated;
}

async function deleteCourse(id, user) {
    const course = await courseModel.findById(id);
    if (!course) throw new AppError("Course not found", 404);
    if (!isOwnerOrAdmin(user, course)) {
        throw new AppError("You do not have permission to delete this course", 403);
    }

    const activeEnrollments = await enrollmentModel.countActiveForCourse(id);
    if (activeEnrollments > 0) {
        throw new AppError("Cannot delete a course with active enrollments", 409);
    }

    await courseModel.softDelete(id);

    await auditLogModel.log({
        actorUserId: user.id,
        action: "course_deleted",
        entityType: "course",
        entityId: id,
    });
}

module.exports = {
    createCourse,
    getCourse,
    listCourses,
    listMyCourses,
    updateCourse,
    publish: (id, user) => setStatus(id, user, "published"),
    archive: (id, user) => setStatus(id, user, "archived"),
    deleteCourse,
};
