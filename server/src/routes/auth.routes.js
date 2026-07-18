const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { registerValidator, loginValidator } = require("../validators/auth.validator");
const validate = require("../middleware/validate.middleware");
const { loginLimiter, registerLimiter, refreshLimiter } = require("../middleware/rateLimiter.middleware");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

router.get("/csrf-token", authController.getCsrfToken);
router.post("/register", registerLimiter, registerValidator, validate, authController.register);
router.post("/login", loginLimiter, loginValidator, validate, authController.login);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;
