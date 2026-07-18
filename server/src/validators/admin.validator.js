const { body, param, query } = require("express-validator");

const VALID_ROLES = ["student", "instructor", "admin"];

const userIdParamValidator = [param("id").isUUID().withMessage("Invalid user id")];

const updateRoleValidator = [
    body("role").isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),
];

const listUsersValidator = [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("role").optional().isIn(VALID_ROLES).withMessage("Invalid role filter"),
    query("search").optional().trim().isLength({ max: 200 }),
];

module.exports = { userIdParamValidator, updateRoleValidator, listUsersValidator };
