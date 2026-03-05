import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/api/rate-limit";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { processPendingClaimValidations } from "@/lib/game/claim-validation-queue";
import { removeTeamsWithoutMembers } from "@/lib/cron/cleanup-empty-teams";

type CronTaskId = "cleanup-empty-teams" | "process-claim-validations";

type CronTaskResult = {
  task: CronTaskId;
  ok: boolean;
  message: string;
  deletedTeams?: number;
  scanned?: number;
  approved?: number;
  manualReview?: number;
  skipped?: number;
  failed?: number;
};

const TASK_REGISTRY: Record<CronTaskId, () => Promise<CronTaskResult>> = {
  "process-claim-validations": async () => {
    const queue = await processPendingClaimValidations({
      limit: Math.min(
        Math.max(Number.parseInt(process.env.CLAIM_VALIDATION_CRON_BATCH_SIZE ?? "8", 10) || 8, 1),
        30,
      ),
    });

    return {
      task: "process-claim-validations",
      ok: queue.failed === 0,
      scanned: queue.scanned,
      approved: queue.approved,
      manualReview: queue.manualReview,
      skipped: queue.skipped,
      failed: queue.failed,
      message: `Zpracováno ${queue.scanned} žádostí (${queue.approved} auto-schváleno, ${queue.manualReview} ruční kontrola).`,
    };
  },
  "cleanup-empty-teams": async () => {
    const deletedTeams = await removeTeamsWithoutMembers();
    return {
      task: "cleanup-empty-teams",
      ok: true,
      deletedTeams,
      message: `Vyčištěno ${deletedTeams} prázdných týmů.`,
    };
  },
};

function getCronAccessError(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();

  if (!configuredSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRON_SECRET není nastaveno. /api/cron je v produkci vypnuto.");
      return NextResponse.json(
        { ok: false, message: "Cron endpoint není v produkci nakonfigurován." },
        { status: 503 },
      );
    }

    return null;
  }

  const providedSecret = request.headers.get("x-cron-secret")?.trim();
  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Přístup odepřen.",
      },
      { status: 403 },
    );
  }

  return null;
}

function resolveRequestedTasks(request: Request): CronTaskId[] | null {
  const { searchParams } = new URL(request.url);
  const tasksParam = searchParams.get("tasks")?.trim();

  if (!tasksParam) {
    return ["process-claim-validations", "cleanup-empty-teams"];
  }

  const requested = tasksParam
    .split(",")
    .map((task) => task.trim())
    .filter((task) => task.length > 0);

  if (requested.length === 0) {
    return ["process-claim-validations", "cleanup-empty-teams"];
  }

  const allTaskIds = new Set<CronTaskId>(["process-claim-validations", "cleanup-empty-teams"]);
  const valid = requested.every((task) => allTaskIds.has(task as CronTaskId));
  if (!valid) {
    return null;
  }

  return requested as CronTaskId[];
}

async function handleCronRun(request: Request) {
  const rateLimited = await applyRateLimit({
    request,
    prefix: "cron-run",
    max: 120,
    windowMs: 5 * 60 * 1000,
    message: "Příliš mnoho cron požadavků v krátkém čase. Zkuste to prosím později.",
  });
  if (rateLimited) {
    return rateLimited;
  }

  const accessError = getCronAccessError(request);
  if (accessError) {
    return accessError;
  }

  const tasks = resolveRequestedTasks(request);
  if (!tasks) {
    return NextResponse.json(
      {
        ok: false,
        message: "Neplatný seznam cron tasků.",
        availableTasks: ["process-claim-validations", "cleanup-empty-teams"],
      },
      { status: 400 },
    );
  }

  const results: CronTaskResult[] = [];

  for (const task of tasks) {
    try {
      const result = await TASK_REGISTRY[task]();
      results.push(result);
    } catch (error) {
      console.error(`Cron task ${task} selhal:`, error);
      results.push({
        task,
        ok: false,
        message: "Task selhal.",
      });
    }
  }

  const ok = results.every((result) => result.ok);
  return NextResponse.json(
    {
      ok,
      ranAt: new Date().toISOString(),
      tasks: results,
    },
    { status: ok ? 200 : 500 },
  );
}

export async function GET(request: Request) {
  return withApiWriteObservability(
    { request, operation: "cron.run.get" },
    async () => handleCronRun(request),
  );
}

export async function POST(request: Request) {
  return withApiWriteObservability(
    { request, operation: "cron.run.post" },
    async () => handleCronRun(request),
  );
}
