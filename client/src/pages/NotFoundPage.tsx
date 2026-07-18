import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-3xl font-semibold text-slate-900 dark:text-white">404</h1>
      <p className="mb-4 text-slate-500 dark:text-slate-400">Page not found.</p>
      <Link to="/" className="text-sm font-medium text-slate-900 underline dark:text-white">
        Back to courses
      </Link>
    </div>
  );
}
