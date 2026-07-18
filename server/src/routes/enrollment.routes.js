const { Router } = require("express");
const enrollmentController = require("../controllers/enrollment.controller");
const { enrollmentIdParamValidator, listEnrollmentsValidator } = require("../validators/enrollment.validator");
const validate = require("../middleware/validate.middleware");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = Router();

router.get("/me", authenticate, authorize("student"), listEnrollmentsValidator, validate, enrollmentController.mine);
router.patch("/:id/cancel", authenticate, enrollmentIdParamValidator, validate, enrollmentController.cancel);
router.patch(
    "/:id/complete",
    authenticate,
    authorize("instructor", "admin"),
    enrollmentIdParamValidator,
    validate,
    enrollmentController.complete
);

module.exports = router;
