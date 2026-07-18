import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments";
import { coursesApi } from "../api/courses";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";

export function CourseRosterPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const courseQuery = useQuery({
    queryKey: ["courses", id],
    queryFn: () => coursesApi.get(id!),
    enabled: !!id,
  });

  const rosterQuery = useQuery({
    queryKey: ["courses", id, "enrollments", { page }],
    queryFn: () => enrollmentsApi.roster(id!, { page, limit: 15 }),
    enabled: !!id,
  });

  const completeMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsApi.complete(enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses", id, "enrollments"] }),
  });

  return (
    <div>
      <Link to={`/courses/${id}`} className="mb-4 inline-block text-sm text-slate-500 hover:underline dark:text-slate-400">
        &larr; Back to course
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
        Roster{courseQuery.data ? `: ${courseQuery.data.title}` : ""}
      </h1>

      {rosterQuery.isLoading && <LoadingSpinner />}
      {rosterQuery.error && (
        <ErrorMessage message={rosterQuery.error instanceof ApiError ? rosterQuery.error.message : "Failed to load roster"} />
      )}
      {rosterQuery.data && rosterQuery.data.enrollments.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No students enrolled yet.</p>
      )}

      {rosterQuery.data && rosterQuery.data.enrollments.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Student</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Enrolled</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rosterQuery.data.enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="px-4 py-2 text-slate-900 dark:text-white">
                    {enrollment.student_first_name} {enrollment.student_last_name}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{enrollment.student_email}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={enrollment.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {enrollment.status === "active" && (
                      <button
                        type="button"
                        onClick={() => completeMutation.mutate(enrollment.id)}
                        disabled={completeMutation.isPending}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Mark complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rosterQuery.data && <Pagination pagination={rosterQuery.data.pagination} onPageChange={setPage} />}
    </div>
  );
}
