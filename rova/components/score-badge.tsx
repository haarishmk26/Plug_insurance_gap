interface ScoreBadgeProps {
  score: number | null | undefined;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Pending
      </span>
    );
  }

  const color =
    score >= 70
      ? "bg-emerald-50 text-emerald-700"
      : score >= 40
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}
