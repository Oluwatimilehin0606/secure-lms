import { NavLink, Outlet } from "react-router-dom";
import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-slate-600 hover:bg-accent hover:text-accent-foreground dark:text-slate-300"
  }`;

export function Layout() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <NavLink to="/" className="mr-3 text-lg font-semibold text-slate-900 dark:text-white">
              Secure LMS
            </NavLink>
            <NavLink to="/" end className={linkClass}>
              Courses
            </NavLink>
            {user?.role === "student" && (
              <>
                <NavLink to="/my-enrollments" className={linkClass}>
                  My Learning
                </NavLink>
                <NavLink to="/my-payments" className={linkClass}>
                  Payments
                </NavLink>
              </>
            )}
            {user?.role === "instructor" && (
              <NavLink to="/my-courses" className={linkClass}>
                My Courses
              </NavLink>
            )}
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin/users" className={linkClass}>
                  Users
                </NavLink>
                <NavLink to="/admin/payments" className={linkClass}>
                  All Payments
                </NavLink>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {user.firstName}
                    <ChevronDownIcon className="size-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="capitalize text-muted-foreground font-normal">
                    Signed in as {user.role}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isLoggingOut}
                    onSelect={() => logout()}
                  >
                    <LogOutIcon />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <NavLink to="/login">Log in</NavLink>
                </Button>
                <Button asChild size="sm">
                  <NavLink to="/register">Sign up</NavLink>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
