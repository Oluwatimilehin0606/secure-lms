import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enrollmentsApi } from "../api/enrollments";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const ALL = "all";

export function MyEnrollmentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["enrollments", "me", { page, statusFilter }],
    queryFn: () => enrollmentsApi.mine({ page, limit: 10, status: statusFilter === ALL ? undefined : statusFilter }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => enrollmentsApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">My learning</h1>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error instanceof ApiError ? error.message : "Failed to load"} />}
      {data && data.enrollments.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          No enrollments yet.{" "}
          <Link to="/" className="text-primary underline underline-offset-2">
            Browse courses
          </Link>{" "}
          to get started.
        </p>
      )}

      {data && data.enrollments.length > 0 && (
        <div className="space-y-3">
          {data.enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="py-4">
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    to={`/courses/${enrollment.course_id}`}
                    className="font-medium text-slate-900 hover:underline dark:text-white"
                  >
                    {enrollment.course_title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={enrollment.status} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {enrollment.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelMutation.mutate(enrollment.id)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
