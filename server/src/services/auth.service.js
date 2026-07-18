const crypto = require("crypto");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signAccessToken, generateRefreshToken, hashToken } = require("../utils/jwt");
const userModel = require("../models/user.model");
const roleModel = require("../models/role.model");
const refreshTokenModel = require("../models/refreshToken.model");
const securityLogModel = require("../models/securityLog.model");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// Fixed dummy hash so a login for a non-existent email still pays the argon2 cost,
// keeping response timing indistinguishable from a wrong-password attempt.
const DUMMY_HASH =
    "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$1MSm4nEwl0MvIn1u5TA/L9DKmU5UpMKPzGZhTBQVfk4";

async function register({ firstName, lastName, email, password }, meta) {
    const existing = await userModel.findByEmail(email);
    if (existing) {
        throw new AppError("An account with that email already exists", 409);
    }

    const studentRole = await roleModel.findRoleByName("student");
    if (!studentRole) {
        throw new AppError("Registration is temporarily unavailable", 500);
    }

    const passwordHash = await hashPassword(password);
    const user = await userModel.createUser({
        firstName,
        lastName,
        email,
        passwordHash,
        roleId: studentRole.id,
    });

    await securityLogModel.log({
        userId: user.id,
        eventType: "user_registered",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        severity: "info",
        success: true,
    });

    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: studentRole.name,
    };
}

async function login({ email, password }, meta) {
    const user = await userModel.findByEmail(email);

    if (!user) {
        await verifyPassword(DUMMY_HASH, password).catch(() => {});
        await securityLogModel.log({
            eventType: "login_failed",
            description: `No account for ${email}`,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            severity: "warning",
            success: false,
        });
        throw new AppError("Invalid email or password", 401);
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
        await securityLogModel.log({
            userId: user.id,
            eventType: "login_blocked_locked",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            severity: "warning",
            success: false,
        });
        throw new AppError("Account temporarily locked due to too many failed login attempts", 423);
    }

    if (!user.is_active) {
        await securityLogModel.log({
            userId: user.id,
            eventType: "login_blocked_inactive",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            severity: "warning",
            success: false,
        });
        throw new AppError("Invalid email or password", 401);
    }

    const passwordValid = await verifyPassword(user.password_hash, password);
    if (!passwordValid) {
        const attempts = await userModel.incrementFailedLoginAttempts(user.id);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            await userModel.lockAccount(user.id, new Date(Date.now() + LOCK_DURATION_MS));
            await securityLogModel.log({
                userId: user.id,
                eventType: "account_locked",
                description: `Locked after ${attempts} failed attempts`,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
                severity: "critical",
                success: false,
            });
        } else {
            await securityLogModel.log({
                userId: user.id,
                eventType: "login_failed",
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent,
                severity: "warning",
                success: false,
            });
        }

        throw new AppError("Invalid email or password", 401);
    }

    await userModel.resetLoginState(user.id);
    await securityLogModel.log({
        userId: user.id,
        eventType: "login_success",
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        severity: "info",
        success: true,
    });

    const tokens = await issueTokenPair(user, meta);

    return {
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
        },
        ...tokens,
    };
}

async function issueTokenPair(user, meta, familyId = crypto.randomUUID()) {
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    const expiresAt = new Date(Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

    await refreshTokenModel.create({
        userId: user.id,
        familyId,
        tokenHash,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
    });

    return { accessToken, refreshToken };
}

async function refresh(rawToken, meta) {
    if (!rawToken) throw new AppError("Authentication required", 401);

    const tokenHash = hashToken(rawToken);
    const stored = await refreshTokenModel.findByHash(tokenHash);

    if (!stored) throw new AppError("Invalid session", 401);

    if (stored.revoked_at) {
        // Reuse of an already-rotated token indicates the token was stolen — burn the whole family.
        await refreshTokenModel.revokeFamily(stored.family_id);
        await securityLogModel.log({
            userId: stored.user_id,
            eventType: "refresh_token_reuse_detected",
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            severity: "critical",
            success: false,
        });
        throw new AppError("Session invalidated, please log in again", 401);
    }

    if (new Date(stored.expires_at) < new Date()) {
        throw new AppError("Session expired, please log in again", 401);
    }

    const user = await userModel.findById(stored.user_id);
    if (!user || !user.is_active) {
        throw new AppError("Invalid session", 401);
    }

    await refreshTokenModel.revokeById(stored.id);
    const tokens = await issueTokenPair(user, meta, stored.family_id);

    return {
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: user.role,
        },
        ...tokens,
    };
}

async function logout(rawToken) {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    const stored = await refreshTokenModel.findByHash(tokenHash);
    if (stored && !stored.revoked_at) {
        await refreshTokenModel.revokeById(stored.id);
    }
}

module.exports = { register, login, refresh, logout };
