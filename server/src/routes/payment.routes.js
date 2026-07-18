const { Router } = require("express");
const paymentController = require("../controllers/payment.controller");
const {
    initiatePaymentValidator,
    referenceParamValidator,
    confirmPaymentValidator,
    paymentIdParamValidator,
    listPaymentsValidator,
    listAllPaymentsValidator,
} = require("../validators/payment.validator");
const validate = require("../middleware/validate.middleware");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = Router();

router.use(authenticate);

router.post("/", authorize("student"), initiatePaymentValidator, validate, paymentController.initiate);
router.post(
    "/:reference/confirm",
    referenceParamValidator,
    confirmPaymentValidator,
    validate,
    paymentController.confirm
);
router.get("/me", authorize("student"), listPaymentsValidator, validate, paymentController.mine);
router.get("/", authorize("admin"), listAllPaymentsValidator, validate, paymentController.listAll);
router.get("/:id", paymentIdParamValidator, validate, paymentController.getOne);

module.exports = router;
