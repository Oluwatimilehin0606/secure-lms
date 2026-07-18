import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api/courses";
import { enrollmentsApi } from "../api/enrollments";
import { paymentsApi } from "../api/payments";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatusBadge } from "../components/StatusBadge";
import { PaymentModal } from "../components/PaymentModal";
import type { Payment } from "../types";

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<Payment | null>(null);

  const courseQuery = useQuery({
    queryKey: ["courses", id],
    queryFn: () => coursesApi.get(id!),
    enabled: !!id,
    retry: false,
  });

  const myEnrollmentsQuery = useQuery({
    queryKey: ["enrollments", "me", "all"],
    queryFn: () => enrollmentsApi.mine({ limit: 100 }),
    enabled: !!user && user.role === "student",
  });

  const myEnrollment = myEnrollmentsQuery.data?.enrollments.find((e) => e.course_id === id);

  const isOwner =
    !!user &&
    !!courseQuery.data &&
    (user.role === "admin" || (user.role === "instructor" && user.id === courseQuery.data.instructor_id));

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentsApi.enroll(id!),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
    },
    onError: async (err) => {
      if (err instanceof ApiError && err.status === 402) {
        try {
          const payment = await paymentsApi.initiate(id!);
          setPendingPayment(payment);
          setActionError(null);
        } catch (initErr) {
          setActionError(initErr instanceof ApiError ? initErr.message : "Could not start payment");
        }
        return;
      }
      setActionError(err instanceof ApiError ? err.message : "Could not enroll");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsApi.cancel(enrollmentId),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Could not cancel enrollment"),
  });

  const publishMutation = useMutation({
    mutationFn: () => coursesApi.publish(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Could not publish course"),
  });

  const archiveMutation = useMutation({
    mutationFn: () => coursesApi.archive(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Could not archive course"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.remove(id!),
    onSuccess: () => navigate("/my-courses"),
    onError: (err) => setActionError(err instanceof ApiError ? err.message : "Could not delete course"),
  });

  if (courseQuery.isLoading) return <LoadingSpinner label="Loading course..." />;

  if (courseQuery.isError) {
    return <ErrorMessage message="Course not found." />;
  }

  const course = courseQuery.data!;
  const price = Number(course.price);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{course.title}</h1>
            {isOwner && <StatusBadge status={course.status} />}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            By {course.instructor_first_name} {course.instructor_last_name}
          </p>
        </div>
        <span className="text-xl font-semibold text-slate-900 dark:text-white">
          {price > 0 ? `$${price.toFixed(2)}` : "Free"}
        </span>
      </div>

      <p className="mb-6 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{course.description}</p>

      {actionError && (
        <div className="mb-4">
          <ErrorMessage message={actionError} />
        </div>
      )}

      {isOwner && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <Link
            to={`/courses/${course.id}/edit`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Edit
          </Link>
          <Link
            to={`/courses/${course.id}/roster`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            View roster
          </Link>
          {course.status !== "published" && (
            <button
              type="button"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Publish
            </button>
          )}
          {course.status !== "archived" && (
            <button
              type="button"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Archive
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this course? This cannot be undone.")) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      )}

      {!isOwner && user?.role === "student" && (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          {!myEnrollment && (
            <button
              type="button"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {enrollMutation.isPending ? "Please wait..." : price > 0 ? `Enroll for $${price.toFixed(2)}` : "Enroll for free"}
            </button>
          )}

          {myEnrollment?.status === "active" && (
            <div className="flex items-center gap-3">
              <StatusBadge status="active" />
              <span className="text-sm text-slate-600 dark:text-slate-400">You&apos;re enrolled in this course.</span>
              <button
                type="button"
                onClick={() => cancelMutation.mutate(myEnrollment.id)}
                disabled={cancelMutation.isPending}
                className="ml-auto rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel enrollment
              </button>
            </div>
          )}

          {myEnrollment?.status === "completed" && (
            <div className="flex items-center gap-3">
              <StatusBadge status="completed" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                You completed this course
                {myEnrollment.completed_at ? ` on ${new Date(myEnrollment.completed_at).toLocaleDateString()}` : ""}.
              </span>
            </div>
          )}

          {myEnrollment?.status === "cancelled" && (
            <button
              type="button"
              onClick={() => enrollMutation.mutate()}
              disabled={enrollMutation.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {enrollMutation.isPending ? "Please wait..." : "Re-enroll"}
            </button>
          )}
        </div>
      )}

      {!user && (
        <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <Link to="/login" state={{ from: `/courses/${course.id}` }} className="font-medium text-slate-900 underline dark:text-white">
            Log in
          </Link>{" "}
          as a student to enroll in this course.
        </div>
      )}

      {pendingPayment && (
        <PaymentModal
          courseId={course.id}
          initialPayment={pendingPayment}
          onClose={() => setPendingPayment(null)}
          onEnrolled={() => setPendingPayment(null)}
        />
      )}
    </div>
  );
}
