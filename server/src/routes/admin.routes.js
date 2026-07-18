const { Router } = require("express");
const adminController = require("../controllers/admin.controller");
const { userIdParamValidator, updateRoleValidator, listUsersValidator } = require("../validators/admin.validator");
const validate = require("../middleware/validate.middleware");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/users", listUsersValidator, validate, adminController.listUsers);
router.get("/users/:id", userIdParamValidator, validate, adminController.getUser);
router.patch("/users/:id/role", userIdParamValidator, updateRoleValidator, validate, adminController.updateRole);

module.exports = router;
