import { apiRequest, buildQueryString } from "./client";
import type { Enrollment, Payment, PaymentListResult } from "../types";

export interface PaymentListParams extends Record<string, string | number | undefined> {
  page?: number;
  limit?: number;
  status?: string;
  studentId?: string;
  courseId?: string;
}

export interface ConfirmResult {
  payment: Payment;
  enrollment: Enrollment | null;
}

export const paymentsApi = {
  initiate: (courseId: string) =>
    apiRequest<{ status: string; data: { payment: Payment } }>("/payments", {
      method: "POST",
      body: { courseId },
    }).then((r) => r.data.payment),

  confirm: (reference: string, outcome: "success" | "failure") =>
    apiRequest<{ status: string; data: ConfirmResult }>(`/payments/${reference}/confirm`, {
      method: "POST",
      body: { outcome },
    }).then((r) => r.data),

  mine: (params: PaymentListParams = {}) =>
    apiRequest<{ status: string; data: PaymentListResult }>(`/payments/me${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  listAll: (params: PaymentListParams = {}) =>
    apiRequest<{ status: string; data: PaymentListResult }>(`/payments${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  get: (id: string) => apiRequest<{ status: string; data: { payment: Payment } }>(`/payments/${id}`).then((r) => r.data.payment),
};
