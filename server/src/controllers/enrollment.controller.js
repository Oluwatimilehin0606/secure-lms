const enrollmentService = require("../services/enrollment.service");

async function enroll(req, res) {
    const enrollment = await enrollmentService.enroll(req.params.id, req.user);
    res.status(201).json({ status: "success", data: { enrollment } });
}

async function roster(req, res) {
    const result = await enrollmentService.listCourseRoster(req.params.id, req.user, req.query);
    res.status(200).json({ status: "success", data: result });
}

async function mine(req, res) {
    const result = await enrollmentService.listMyEnrollments(req.user, req.query);
    res.status(200).json({ status: "success", data: result });
}

async function cancel(req, res) {
    const enrollment = await enrollmentService.cancel(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { enrollment } });
}

async function complete(req, res) {
    const enrollment = await enrollmentService.complete(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { enrollment } });
}

module.exports = { enroll, roster, mine, cancel, complete };
