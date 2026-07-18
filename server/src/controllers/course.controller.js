const courseService = require("../services/course.service");

async function create(req, res) {
    const course = await courseService.createCourse(req.user, req.body);
    res.status(201).json({ status: "success", data: { course } });
}

async function list(req, res) {
    const result = await courseService.listCourses(req.user, req.query);
    res.status(200).json({ status: "success", data: result });
}

async function listMine(req, res) {
    const result = await courseService.listMyCourses(req.user, req.query);
    res.status(200).json({ status: "success", data: result });
}

async function getOne(req, res) {
    const course = await courseService.getCourse(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { course } });
}

async function update(req, res) {
    const course = await courseService.updateCourse(req.params.id, req.user, req.body);
    res.status(200).json({ status: "success", data: { course } });
}

async function publish(req, res) {
    const course = await courseService.publish(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { course } });
}

async function archive(req, res) {
    const course = await courseService.archive(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { course } });
}

async function remove(req, res) {
    await courseService.deleteCourse(req.params.id, req.user);
    res.status(200).json({ status: "success", message: "Course deleted" });
}

module.exports = { create, list, listMine, getOne, update, publish, archive, remove };
