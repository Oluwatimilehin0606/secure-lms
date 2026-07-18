const { param, query } = require("express-validator");

const enrollmentIdParamValidator = [param("id").isUUID().withMessage("Invalid enrollment id")];

const listEnrollmentsValidator = [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("status").optional().isIn(["active", "completed", "cancelled"]).withMessage("Invalid status filter"),
];

module.exports = { enrollmentIdParamValidator, listEnrollmentsValidator };
