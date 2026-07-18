import { apiRequest, buildQueryString } from "./client";
import type { Enrollment, EnrollmentListResult } from "../types";

export interface EnrollmentListParams extends Record<string, string | number | undefined> {
  page?: number;
  limit?: number;
  status?: string;
}

export const enrollmentsApi = {
  enroll: (courseId: string) =>
    apiRequest<{ status: string; data: { enrollment: Enrollment } }>(`/courses/${courseId}/enroll`, {
      method: "POST",
    }).then((r) => r.data.enrollment),

  roster: (courseId: string, params: EnrollmentListParams = {}) =>
    apiRequest<{ status: string; data: EnrollmentListResult }>(
      `/courses/${courseId}/enrollments${buildQueryString(params)}`
    ).then((r) => r.data),

  mine: (params: EnrollmentListParams = {}) =>
    apiRequest<{ status: string; data: EnrollmentListResult }>(`/enrollments/me${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  cancel: (id: string) =>
    apiRequest<{ status: string; data: { enrollment: Enrollment } }>(`/enrollments/${id}/cancel`, {
      method: "PATCH",
    }).then((r) => r.data.enrollment),

  complete: (id: string) =>
    apiRequest<{ status: string; data: { enrollment: Enrollment } }>(`/enrollments/${id}/complete`, {
      method: "PATCH",
    }).then((r) => r.data.enrollment),
};
