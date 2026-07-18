const adminService = require("../services/admin.service");

function requestMeta(req) {
    return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

async function listUsers(req, res) {
    const result = await adminService.listUsers(req.query);
    res.status(200).json({ status: "success", data: result });
}

async function getUser(req, res) {
    const user = await adminService.getUser(req.params.id);
    res.status(200).json({ status: "success", data: { user } });
}

async function updateRole(req, res) {
    const user = await adminService.updateUserRole(req.params.id, req.body.role, req.user, requestMeta(req));
    res.status(200).json({ status: "success", data: { user } });
}

module.exports = { listUsers, getUser, updateRole };
