const { body } = require("express-validator");

const registerValidator = [
    body("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 100 }),
    body("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 100 }),
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password")
        .isStrongPassword({
            minLength: 12,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
        .withMessage(
            "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol"
        ),
];

const loginValidator = [
    body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { registerValidator, loginValidator };
