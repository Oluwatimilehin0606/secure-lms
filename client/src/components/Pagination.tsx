import type { Pagination as PaginationType } from "../types";
import { Button } from "./ui/button";

export function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm text-slate-600 dark:text-slate-400">
      <Button variant="outline" size="sm" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
        Previous
      </Button>
      <span>
        Page {pagination.page} of {pagination.totalPages} &middot; {pagination.total} total
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
      >
        Next
      </Button>
    </div>
  );
}
