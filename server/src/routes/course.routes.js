const { Router } = require("express");
const courseController = require("../controllers/course.controller");
const enrollmentController = require("../controllers/enrollment.controller");
const {
    createCourseValidator,
    updateCourseValidator,
    courseIdParamValidator,
    listCoursesValidator,
} = require("../validators/course.validator");
const { listEnrollmentsValidator } = require("../validators/enrollment.validator");
const validate = require("../middleware/validate.middleware");
const { authenticate, authorize, optionalAuthenticate } = require("../middleware/auth.middleware");

const router = Router();

router.get("/", optionalAuthenticate, listCoursesValidator, validate, courseController.list);
router.get(
    "/mine",
    authenticate,
    authorize("instructor", "admin"),
    listCoursesValidator,
    validate,
    courseController.listMine
);
router.get("/:id", courseIdParamValidator, validate, optionalAuthenticate, courseController.getOne);

router.post(
    "/",
    authenticate,
    authorize("instructor", "admin"),
    createCourseValidator,
    validate,
    courseController.create
);
router.patch(
    "/:id",
    authenticate,
    authorize("instructor", "admin"),
    courseIdParamValidator,
    updateCourseValidator,
    validate,
    courseController.update
);
router.patch(
    "/:id/publish",
    authenticate,
    authorize("instructor", "admin"),
    courseIdParamValidator,
    validate,
    courseController.publish
);
router.patch(
    "/:id/archive",
    authenticate,
    authorize("instructor", "admin"),
    courseIdParamValidator,
    validate,
    courseController.archive
);
router.delete(
    "/:id",
    authenticate,
    authorize("instructor", "admin"),
    courseIdParamValidator,
    validate,
    courseController.remove
);

router.post(
    "/:id/enroll",
    authenticate,
    authorize("student"),
    courseIdParamValidator,
    validate,
    enrollmentController.enroll
);
router.get(
    "/:id/enrollments",
    authenticate,
    authorize("instructor", "admin"),
    courseIdParamValidator,
    listEnrollmentsValidator,
    validate,
    enrollmentController.roster
);

module.exports = router;
