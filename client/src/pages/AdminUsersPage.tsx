import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";
import type { Role } from "../types";

const ROLES: Role[] = ["student", "instructor", "admin"];

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", { page, roleFilter, search }],
    queryFn: () => adminApi.listUsers({ page, limit: 15, role: roleFilter || undefined, search: search || undefined }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminApi.updateRole(id, role),
    onSuccess: () => {
      setRowError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err, variables) =>
      setRowError({ id: variables.id, message: err instanceof ApiError ? err.message : "Could not update role" }),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Users</h1>
        <div className="flex flex-wrap gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput);
            }}
            className="flex gap-2"
          >
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email..."
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </form>
          <select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message={error instanceof ApiError ? error.message : "Failed to load users"} />}

      {data && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Active</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 align-top last:border-0 dark:border-slate-800">
                    <td className="px-4 py-2 text-slate-900 dark:text-white">
                      {u.firstName} {u.lastName}
                      {isSelf && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        defaultValue={u.role}
                        disabled={isSelf || updateRoleMutation.isPending}
                        onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value as Role })}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      {rowError?.id === u.id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{rowError.message}</p>}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{u.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-2" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
