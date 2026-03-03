import { NextResponse } from "next/server";
import { withApiWriteObservability } from "@/lib/api/write-observability";
import { removeTeamsWithoutMembers } from "@/lib/cron/cleanup-empty-teams";

type CronTaskId = "cleanup-empty-teams";

type CronTaskResult = {
  task: CronTaskId;
  ok: boolean;
  message: string;
  deletedTeams?: number;
};

const TASK_REGISTRY: Record<CronTaskId, () => Promise<CronTaskResult>> = {
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
    return ["cleanup-empty-teams"];
  }

  const requested = tasksParam
    .split(",")
    .map((task) => task.trim())
    .filter((task) => task.length > 0);

  if (requested.length === 0) {
    return ["cleanup-empty-teams"];
  }

  const allTaskIds = new Set<CronTaskId>(["cleanup-empty-teams"]);
  const valid = requested.every((task) => allTaskIds.has(task as CronTaskId));
  if (!valid) {
    return null;
  }

  return requested as CronTaskId[];
}

async function handleCronRun(request: Request) {
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
        availableTasks: ["cleanup-empty-teams"],
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
