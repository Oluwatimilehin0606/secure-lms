import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "../api/courses";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";

export function MyCoursesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", "mine", { page, statusFilter }],
    queryFn: () => coursesApi.mine({ page, limit: 10, status: statusFilter || undefined }),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My courses</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <Link
            to="/my-courses/new"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            New course
          </Link>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error instanceof ApiError ? error.message : "Failed to load"} />}
      {data && data.courses.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          You haven&apos;t created any courses yet.
        </p>
      )}

      {data && data.courses.length > 0 && (
        <div className="space-y-3">
          {data.courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 hover:shadow-sm dark:border-slate-800"
            >
              <div>
                <span className="font-medium text-slate-900 dark:text-white">{course.title}</span>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={course.status} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : "Free"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
