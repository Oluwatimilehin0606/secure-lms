const paymentService = require("../services/payment.service");

async function initiate(req, res) {
    const payment = await paymentService.initiate(req.user, req.body.courseId);
    res.status(201).json({ status: "success", data: { payment } });
}

async function confirm(req, res) {
    const result = await paymentService.confirm(req.params.reference, req.body.outcome, req.user);
    res.status(200).json({ status: "success", data: result });
}

async function getOne(req, res) {
    const payment = await paymentService.getPayment(req.params.id, req.user);
    res.status(200).json({ status: "success", data: { payment } });
}

async function mine(req, res) {
    const result = await paymentService.listMyPayments(req.user, req.query);
    res.status(200).json({ status: "success", data: result });
}

async function listAll(req, res) {
    const result = await paymentService.listAllPayments(req.query);
    res.status(200).json({ status: "success", data: result });
}

module.exports = { initiate, confirm, getOne, mine, listAll };
