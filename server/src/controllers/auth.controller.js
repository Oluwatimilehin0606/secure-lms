const env = require("../config/env");
const authService = require("../services/auth.service");
const userModel = require("../models/user.model");
const AppError = require("../utils/AppError");
const { generateCsrfToken } = require("../utils/csrf");

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000;
const CSRF_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// sameSite: "lax" is fine for a browser client and API on the same registrable
// domain (e.g. localhost:5173 -> localhost:5000). A cross-domain deployment
// needs sameSite: "none" + secure: true instead.
const baseCookieOptions = {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
};

function setAuthCookies(res, { accessToken, refreshToken }) {
    res.cookie("accessToken", accessToken, {
        ...baseCookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
        path: "/",
    });
    res.cookie("refreshToken", refreshToken, {
        ...baseCookieOptions,
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
        path: "/api/auth",
    });
}

function clearAuthCookies(res) {
    res.clearCookie("accessToken", { ...baseCookieOptions, path: "/" });
    res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/auth" });
}

// Rotated on every login/refresh so a stolen CSRF token has a short useful life.
// Not httpOnly: same-origin JS must be able to read it to echo it back as a header.
function issueCsrfCookie(res) {
    const token = generateCsrfToken();
    res.cookie("csrfToken", token, {
        httpOnly: false,
        secure: env.cookieSecure,
        sameSite: "lax",
        path: "/",
        maxAge: CSRF_COOKIE_MAX_AGE_MS,
    });
    return token;
}

function clearCsrfCookie(res) {
    res.clearCookie("csrfToken", { path: "/" });
}

function requestMeta(req) {
    return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

async function register(req, res) {
    const user = await authService.register(req.body, requestMeta(req));
    res.status(201).json({ status: "success", data: { user } });
}

async function login(req, res) {
    const { user, accessToken, refreshToken } = await authService.login(req.body, requestMeta(req));
    setAuthCookies(res, { accessToken, refreshToken });
    const csrfToken = issueCsrfCookie(res);
    res.status(200).json({ status: "success", data: { user, csrfToken } });
}

async function refresh(req, res) {
    const { user, accessToken, refreshToken } = await authService.refresh(
        req.cookies?.refreshToken,
        requestMeta(req)
    );
    setAuthCookies(res, { accessToken, refreshToken });
    const csrfToken = issueCsrfCookie(res);
    res.status(200).json({ status: "success", data: { user, csrfToken } });
}

async function logout(req, res) {
    await authService.logout(req.cookies?.refreshToken);
    clearAuthCookies(res);
    clearCsrfCookie(res);
    res.status(200).json({ status: "success", message: "Logged out" });
}

async function getCsrfToken(req, res) {
    const csrfToken = issueCsrfCookie(res);
    res.status(200).json({ status: "success", data: { csrfToken } });
}

async function me(req, res) {
    const user = await userModel.findById(req.user.id);
    if (!user) throw new AppError("User not found", 404);

    res.status(200).json({
        status: "success",
        data: {
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
            },
        },
    });
}

module.exports = { register, login, refresh, logout, me, getCsrfToken };
