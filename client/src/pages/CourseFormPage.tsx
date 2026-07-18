import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesApi } from "../api/courses";
import { ApiError } from "../api/client";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  const courseQuery = useQuery({
    queryKey: ["courses", id],
    queryFn: () => coursesApi.get(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (courseQuery.data) {
      setTitle(courseQuery.data.title);
      setDescription(courseQuery.data.description);
      setPrice(courseQuery.data.price);
    }
  }, [courseQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => coursesApi.create({ title, description, price: Number(price) }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate(`/courses/${course.id}`);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Could not create course"),
  });

  const updateMutation = useMutation({
    mutationFn: () => coursesApi.update(id!, { title, description, price: Number(price) }),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      navigate(`/courses/${course.id}`);
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : "Could not update course"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  if (isEditing && courseQuery.isLoading) return <LoadingSpinner label="Loading course..." />;

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900 dark:text-white">
        {isEditing ? "Edit course" : "Create a course"}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <ErrorMessage message={formError} />}
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Title
          </label>
          <input
            id="title"
            required
            minLength={3}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            id="description"
            required
            minLength={10}
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Price (USD, 0 for free)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create course"}
        </button>
      </form>
    </div>
  );
}
