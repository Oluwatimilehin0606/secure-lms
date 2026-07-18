import { apiRequest, buildQueryString } from "./client";
import type { Role, User, UserListResult } from "../types";

export interface UserListParams extends Record<string, string | number | undefined> {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export const adminApi = {
  listUsers: (params: UserListParams = {}) =>
    apiRequest<{ status: string; data: UserListResult }>(`/admin/users${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  getUser: (id: string) =>
    apiRequest<{ status: string; data: { user: User } }>(`/admin/users/${id}`).then((r) => r.data.user),

  updateRole: (id: string, role: Role) =>
    apiRequest<{ status: string; data: { user: User } }>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: { role },
    }).then((r) => r.data.user),
};
