const { body, param, query } = require("express-validator");

const createCourseValidator = [
    body("title").trim().notEmpty().withMessage("Title is required").isLength({ min: 3, max: 200 }),
    body("description").trim().notEmpty().withMessage("Description is required").isLength({ min: 10 }),
    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a non-negative number")
        .toFloat(),
];

const updateCourseValidator = [
    body("title").optional().trim().isLength({ min: 3, max: 200 }),
    body("description").optional().trim().isLength({ min: 10 }),
    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Price must be a non-negative number")
        .toFloat(),
];

const courseIdParamValidator = [param("id").isUUID().withMessage("Invalid course id")];

const listCoursesValidator = [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("search").optional().trim().isLength({ max: 200 }),
    query("instructorId").optional().isUUID().withMessage("Invalid instructor id"),
];

module.exports = {
    createCourseValidator,
    updateCourseValidator,
    courseIdParamValidator,
    listCoursesValidator,
};
