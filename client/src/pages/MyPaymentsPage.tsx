import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatusBadge } from "../components/StatusBadge";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export function MyPaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", "me", { page }],
    queryFn: () => paymentsApi.mine({ page, limit: 15 }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">Payment history</h1>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error instanceof ApiError ? error.message : "Failed to load payments"} />}
      {data && data.payments.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No payments yet.</p>
      )}

      {data && data.payments.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {payment.course_title}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(payment.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    ${Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
