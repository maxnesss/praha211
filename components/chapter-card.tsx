import Link from "next/link";

type ChapterPreviewCell = {
  code: string;
  completed: boolean;
};

type ChapterCardProps = {
  slug: string;
  name: string;
  accentColor: string;
  completed: number;
  total: number;
  progressPercent: number;
  preview: ChapterPreviewCell[];
};

export function ChapterCard({
  slug,
  name,
  accentColor,
  completed,
  total,
  progressPercent,
  preview,
}: ChapterCardProps) {
  return (
    <Link
      href={`/chapter/${slug}`}
      className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-wide text-slate-100">
            {name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {completed} / {total}
          </p>
        </div>
        <span
          className="rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-wider"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          Chapter
        </span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {preview.map((cell) => (
          <div
            key={cell.code}
            className={`h-6 rounded-sm border ${
              cell.completed
                ? "border-emerald-300/50 bg-emerald-400/30"
                : "border-slate-700 bg-slate-950"
            }`}
          />
        ))}
      </div>

      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
          />
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
          {progressPercent}% complete
        </p>
      </div>
    </Link>
  );
}
