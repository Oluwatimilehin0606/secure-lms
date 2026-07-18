const AppError = require("../utils/AppError");
const userModel = require("../models/user.model");
const roleModel = require("../models/role.model");
const auditLogModel = require("../models/auditLog.model");
const securityLogModel = require("../models/securityLog.model");
const refreshTokenModel = require("../models/refreshToken.model");
const { parsePagination } = require("../utils/pagination");

function paginationMeta(page, limit, total) {
    return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function toSafeUser(user) {
    return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
    };
}

async function listUsers(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await userModel.listUsers({ role: query.role, search: query.search, limit, offset });
    return {
        users: rows.map(toSafeUser),
        pagination: paginationMeta(page, limit, total),
    };
}

async function getUser(id) {
    const user = await userModel.findById(id);
    if (!user) throw new AppError("User not found", 404);
    return toSafeUser(user);
}

async function updateUserRole(targetId, newRole, actingUser, meta) {
    if (targetId === actingUser.id) {
        throw new AppError("You cannot change your own role", 403);
    }

    const newRoleRow = await roleModel.findRoleByName(newRole);
    if (!newRoleRow) throw new AppError("Invalid role", 400);

    const result = await userModel.changeRole(targetId, newRoleRow.id, newRole);

    if (result.status === "not_found") throw new AppError("User not found", 404);
    if (result.status === "same_role") throw new AppError(`User already has the ${newRole} role`, 409);
    if (result.status === "last_admin") throw new AppError("Cannot remove the last remaining admin", 409);

    // Force re-authentication so the new role takes effect immediately rather
    // than riding out the old access token's remaining 15-minute lifetime.
    await refreshTokenModel.revokeAllForUser(targetId);

    await auditLogModel.log({
        actorUserId: actingUser.id,
        action: "user_role_changed",
        entityType: "user",
        entityId: targetId,
        details: { from: result.previousRole, to: newRole },
    });

    await securityLogModel.log({
        userId: targetId,
        eventType: "user_role_changed",
        description: `Role changed from ${result.previousRole} to ${newRole} by ${actingUser.id}`,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        severity: "critical",
        success: true,
    });

    return getUser(targetId);
}

module.exports = { listUsers, getUser, updateUserRole };
