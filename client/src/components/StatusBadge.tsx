import { Badge } from "./ui/badge";

const COLORS: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground border-transparent",
  published: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900 dark:text-emerald-300",
  archived: "bg-secondary text-secondary-foreground border-transparent",
  active: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900 dark:text-emerald-300",
  // Completion is a positive milestone, so it gets the brand accent rather than a generic color.
  completed: "bg-primary text-primary-foreground border-transparent",
  cancelled: "bg-secondary text-secondary-foreground border-transparent",
  pending: "bg-amber-100 text-amber-700 border-transparent dark:bg-amber-900 dark:text-amber-300",
  successful: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-900 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive border-transparent dark:text-red-400",
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = COLORS[status] ?? "bg-secondary text-secondary-foreground border-transparent";
  return (
    <Badge variant="outline" className={`capitalize ${colorClass}`}>
      {status}
    </Badge>
  );
}
