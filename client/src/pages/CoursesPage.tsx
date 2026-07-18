import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesApi } from "../api/courses";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { Pagination } from "../components/Pagination";
import { ApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["courses", { page, search }],
    queryFn: () => coursesApi.list({ page, limit: 12, search: search || undefined }),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Browse courses</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="flex gap-2"
        >
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses..."
            className="w-56"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {isLoading && <LoadingSpinner label="Loading courses..." />}
      {error && <ErrorMessage message={error instanceof ApiError ? error.message : "Failed to load courses"} />}

      {data && data.courses.length === 0 && (
        <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">No courses found.</p>
      )}

      {data && data.courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`} className="block h-full">
              <Card className="h-full py-4 transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">{course.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {course.instructor_first_name} {course.instructor_last_name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {Number(course.price) > 0 ? `$${Number(course.price).toFixed(2)}` : "Free"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && <Pagination pagination={data.pagination} onPageChange={setPage} />}
    </div>
  );
}
