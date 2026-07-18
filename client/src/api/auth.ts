import { apiRequest } from "./client";
import type { User } from "../types";

interface UserEnvelope {
  status: string;
  data: { user: User };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const authApi = {
  me: () => apiRequest<UserEnvelope>("/auth/me").then((r) => r.data.user),

  login: (email: string, password: string) =>
    apiRequest<UserEnvelope>("/auth/login", { method: "POST", body: { email, password } }).then((r) => r.data.user),

  register: (payload: RegisterPayload) =>
    apiRequest<UserEnvelope>("/auth/register", { method: "POST", body: payload }).then((r) => r.data.user),

  logout: () => apiRequest<{ status: string; message: string }>("/auth/logout", { method: "POST" }),
};
