import type { NextResponse } from "next/server";

type ApiWriteObservabilityInput = {
  request: Request;
  operation: string;
};

type ApiWriteResponse = Response | NextResponse;

type ApiWriteObservation = {
  event: "api_write_observation";
  operation: string;
  method: string;
  path: string;
  status: number;
  statusClass: string;
  latencyMs: number;
  rateLimited: boolean;
};

function nowMs() {
  return Date.now();
}

function toStatusClass(status: number) {
  const bucket = Math.floor(status / 100);
  return `${bucket}xx`;
}

function buildObservation(input: {
  request: Request;
  operation: string;
  status: number;
  latencyMs: number;
}): ApiWriteObservation {
  const url = new URL(input.request.url);

  return {
    event: "api_write_observation",
    operation: input.operation,
    method: input.request.method,
    path: url.pathname,
    status: input.status,
    statusClass: toStatusClass(input.status),
    latencyMs: input.latencyMs,
    rateLimited: input.status === 429,
  };
}

function logObservation(observation: ApiWriteObservation, error?: unknown) {
  if (observation.status >= 500 || error) {
    console.error("API write observation", {
      ...observation,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : undefined,
    });
    return;
  }

  if (observation.status >= 400 || observation.rateLimited) {
    console.warn("API write observation", observation);
    return;
  }

  console.info("API write observation", observation);
}

export async function withApiWriteObservability(
  input: ApiWriteObservabilityInput,
  handler: () => Promise<ApiWriteResponse | undefined>,
) {
  const startedAtMs = nowMs();
  let response: ApiWriteResponse | null = null;

  try {
    const maybeResponse = await handler();
    if (!maybeResponse) {
      throw new Error("API write route nevrátila odpověď.");
    }
    response = maybeResponse;
    return response;
  } catch (error) {
    const observation = buildObservation({
      request: input.request,
      operation: input.operation,
      status: 500,
      latencyMs: nowMs() - startedAtMs,
    });
    logObservation(observation, error);
    throw error;
  } finally {
    if (!response) {
      return;
    }

    const observation = buildObservation({
      request: input.request,
      operation: input.operation,
      status: response.status,
      latencyMs: nowMs() - startedAtMs,
    });
    logObservation(observation);
  }
}
