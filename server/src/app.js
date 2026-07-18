const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const courseRoutes = require("./routes/course.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");
const verifyCsrf = require("./middleware/csrf.middleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler.middleware");

const app = express();

// Security Middleware
app.use(helmet());

// Allow frontend requests (with cookies) from the configured client origin only
app.use(
    cors({
        origin: env.clientOrigin,
        credentials: true,
    })
);

// Parse JSON
app.use(express.json());

// Parse cookies (needed to read the httpOnly auth cookies)
app.use(cookieParser());

// Log HTTP requests
app.use(morgan("dev"));

// CSRF protection (double-submit cookie) for all state-changing requests
app.use(verifyCsrf);

// Health Check Route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Secure LMS API is running 🚀"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
