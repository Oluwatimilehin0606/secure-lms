const { body, param, query } = require("express-validator");

const initiatePaymentValidator = [body("courseId").isUUID().withMessage("A valid courseId is required")];

const referenceParamValidator = [
    param("reference").trim().notEmpty().isLength({ max: 100 }).withMessage("Invalid payment reference"),
];

const confirmPaymentValidator = [
    body("outcome").isIn(["success", "failure"]).withMessage("outcome must be 'success' or 'failure'"),
];

const paymentIdParamValidator = [param("id").isUUID().withMessage("Invalid payment id")];

const listPaymentsValidator = [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(["pending", "successful", "failed"]).withMessage("Invalid status filter"),
];

const listAllPaymentsValidator = [
    ...listPaymentsValidator,
    query("studentId").optional().isUUID().withMessage("Invalid studentId"),
    query("courseId").optional().isUUID().withMessage("Invalid courseId"),
];

module.exports = {
    initiatePaymentValidator,
    referenceParamValidator,
    confirmPaymentValidator,
    paymentIdParamValidator,
    listPaymentsValidator,
    listAllPaymentsValidator,
};
