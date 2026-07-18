export type Role = "student" | "instructor" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export type CourseStatus = "draft" | "published" | "archived";

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  price: string;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
  instructor_first_name?: string;
  instructor_last_name?: string;
}

export type EnrollmentStatus = "active" | "completed" | "cancelled";

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  course_title?: string;
  course_price?: string;
  student_first_name?: string;
  student_last_name?: string;
  student_email?: string;
}

export type PaymentStatus = "pending" | "successful" | "failed";

export interface Payment {
  id: string;
  student_id: string;
  course_id: string;
  amount: string;
  status: PaymentStatus;
  reference: string;
  created_at: string;
  updated_at: string;
  course_title?: string;
  student_first_name?: string;
  student_last_name?: string;
  student_email?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseListResult {
  courses: Course[];
  pagination: Pagination;
}

export interface EnrollmentListResult {
  enrollments: Enrollment[];
  pagination: Pagination;
}

export interface PaymentListResult {
  payments: Payment[];
  pagination: Pagination;
}

export interface UserListResult {
  users: User[];
  pagination: Pagination;
}
