import { apiRequest, buildQueryString } from "./client";
import type { Course, CourseListResult } from "../types";

export interface CourseListParams extends Record<string, string | number | undefined> {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  instructorId?: string;
}

export interface CourseInput {
  title: string;
  description: string;
  price?: number;
}

export const coursesApi = {
  list: (params: CourseListParams = {}) =>
    apiRequest<{ status: string; data: CourseListResult }>(`/courses${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  mine: (params: CourseListParams = {}) =>
    apiRequest<{ status: string; data: CourseListResult }>(`/courses/mine${buildQueryString(params)}`).then(
      (r) => r.data
    ),

  get: (id: string) => apiRequest<{ status: string; data: { course: Course } }>(`/courses/${id}`).then((r) => r.data.course),

  create: (payload: CourseInput) =>
    apiRequest<{ status: string; data: { course: Course } }>("/courses", { method: "POST", body: payload }).then(
      (r) => r.data.course
    ),

  update: (id: string, payload: Partial<CourseInput>) =>
    apiRequest<{ status: string; data: { course: Course } }>(`/courses/${id}`, {
      method: "PATCH",
      body: payload,
    }).then((r) => r.data.course),

  publish: (id: string) =>
    apiRequest<{ status: string; data: { course: Course } }>(`/courses/${id}/publish`, { method: "PATCH" }).then(
      (r) => r.data.course
    ),

  archive: (id: string) =>
    apiRequest<{ status: string; data: { course: Course } }>(`/courses/${id}/archive`, { method: "PATCH" }).then(
      (r) => r.data.course
    ),

  remove: (id: string) => apiRequest<{ status: string; message: string }>(`/courses/${id}`, { method: "DELETE" }),
};
