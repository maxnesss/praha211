#!/usr/bin/env node

import net from "node:net";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REGISTRATION_CODE = "sokol";
const PASSWORD = "testpass123";
const BASE_PORT = 4100;
const PORT_SCAN_LIMIT = 40;
const SERVER_BOOT_TIMEOUT_MS = 60_000;
const SERVER_STOP_TIMEOUT_MS = 8_000;
const SERVER_FORCE_STOP_TIMEOUT_MS = 3_000;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildNamespace() {
  return `core-flows-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort() {
  for (let offset = 0; offset < PORT_SCAN_LIMIT; offset += 1) {
    const candidate = BASE_PORT + offset;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Nepodařilo se najít volný port v rozsahu ${BASE_PORT}-${BASE_PORT + PORT_SCAN_LIMIT - 1}.`,
  );
}

async function waitForServer(baseUrl) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < SERVER_BOOT_TIMEOUT_MS) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/csrf`);
      if (response.ok) {
        const payload = await response.json();
        if (typeof payload?.csrfToken === "string" && payload.csrfToken.length > 0) {
          return;
        }
      }
    } catch {
      // Server is still starting.
    }

    await delay(500);
  }

  throw new Error("Test server se nestihl spustit včas.");
}

function parseSetCookie(setCookieValue) {
  const firstSegment = setCookieValue.split(";")[0] ?? "";
  const equalIndex = firstSegment.indexOf("=");
  if (equalIndex <= 0) {
    return null;
  }

  const name = firstSegment.slice(0, equalIndex).trim();
  const value = firstSegment.slice(equalIndex + 1).trim();
  if (!name) {
    return null;
  }

  return { name, value };
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  updateFromResponse(response) {
    const getSetCookie =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie.bind(response.headers)
        : null;

    const setCookieValues = getSetCookie ? getSetCookie() : [];
    for (const rawCookie of setCookieValues) {
      const parsed = parseSetCookie(rawCookie);
      if (parsed) {
        this.cookies.set(parsed.name, parsed.value);
      }
    }
  }

  toHeaderValue() {
    if (this.cookies.size === 0) {
      return "";
    }

    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

class SessionClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new CookieJar();
  }

  async request(path, options = {}) {
    const {
      method = "GET",
      json,
      form,
      expectedStatus,
      expectedStatuses,
    } = options;

    const headers = new Headers();
    const cookieHeader = this.cookies.toHeaderValue();
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }

    let body;
    if (json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(json);
    } else if (form !== undefined) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
      body = new URLSearchParams(form).toString();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    this.cookies.updateFromResponse(response);

    const text = await response.text();
    let payload = null;
    if (text.length > 0) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    const allowedStatuses =
      expectedStatuses
      ?? (expectedStatus !== undefined ? [expectedStatus] : null);

    if (allowedStatuses && !allowedStatuses.includes(response.status)) {
      throw new Error(
        [
          `Nečekaný status pro ${method} ${path}: ${response.status}`,
          `Povolené statusy: ${allowedStatuses.join(", ")}`,
          text ? `Tělo: ${text}` : "Tělo: <prázdné>",
        ].join("\n"),
      );
    }

    return {
      status: response.status,
      payload,
      text,
    };
  }

  async login(email, password) {
    const csrf = await this.request("/api/auth/csrf", { expectedStatus: 200 });
    const csrfToken = csrf.payload?.csrfToken;
    assert(
      typeof csrfToken === "string" && csrfToken.length > 0,
      "Nepodařilo se získat CSRF token pro přihlášení.",
    );

    const loginResponse = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      form: {
        csrfToken,
        email,
        password,
        callbackUrl: `${this.baseUrl}/radnice`,
        json: "true",
      },
      expectedStatus: 200,
    });

    const loginUrl = loginResponse.payload?.url ?? "";
    assert(
      typeof loginUrl === "string" && !loginUrl.includes("error=CredentialsSignin"),
      `Přihlášení selhalo pro ${email}.`,
    );
  }
}

async function startServer(baseUrl, port) {
  const env = {
    ...process.env,
    NEXTAUTH_URL: baseUrl,
    NEXT_PUBLIC_SITE_URL: baseUrl,
  };

  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const child = spawn(command, ["run", "start", "--", "--port", String(port)], {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });

  let logs = "";

  const onStdout = (chunk) => {
    logs += chunk.toString();
    if (logs.length > 4000) {
      logs = logs.slice(-4000);
    }
  };
  const onStderr = (chunk) => {
    logs += chunk.toString();
    if (logs.length > 4000) {
      logs = logs.slice(-4000);
    }
  };

  child.stdout.on("data", onStdout);
  child.stderr.on("data", onStderr);

  try {
    await waitForServer(baseUrl);
    return { child, getRecentLogs: () => logs };
  } catch (error) {
    await stopServer(child);
    throw new Error(
      [
        error instanceof Error ? error.message : String(error),
        "Poslední logy serveru:",
        logs || "<žádné logy>",
      ].join("\n"),
    );
  }
}

function hasProcessExited(serverProcess) {
  return (
    serverProcess.exitCode !== null
    || serverProcess.signalCode !== null
  );
}

function sendSignalToServerProcess(serverProcess, signal) {
  if (hasProcessExited(serverProcess)) {
    return;
  }

  if (process.platform !== "win32" && typeof serverProcess.pid === "number") {
    try {
      process.kill(-serverProcess.pid, signal);
      return;
    } catch {
      // Fall back to single-process signaling below.
    }
  }

  serverProcess.kill(signal);
}

async function waitForProcessExit(serverProcess, timeoutMs) {
  if (hasProcessExited(serverProcess)) {
    return true;
  }

  const exited = await Promise.race([
    once(serverProcess, "exit").then(() => true).catch(() => true),
    delay(timeoutMs).then(() => false),
  ]);

  return exited;
}

async function stopServer(serverProcess) {
  if (!serverProcess || hasProcessExited(serverProcess)) {
    return;
  }

  sendSignalToServerProcess(serverProcess, "SIGTERM");
  const exitedGracefully = await waitForProcessExit(serverProcess, SERVER_STOP_TIMEOUT_MS);
  if (exitedGracefully) {
    return;
  }

  sendSignalToServerProcess(serverProcess, "SIGKILL");
  await waitForProcessExit(serverProcess, SERVER_FORCE_STOP_TIMEOUT_MS);
}

async function cleanupByNamespace(namespace) {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: `${namespace}.`,
      },
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return;
  }

  const userIds = users.map((user) => user.id);
  const teams = await prisma.team.findMany({
    where: {
      OR: [
        { leaderUserId: { in: userIds } },
        { users: { some: { id: { in: userIds } } } },
      ],
    },
    select: { id: true },
  });
  const teamIds = teams.map((team) => team.id);

  await prisma.districtClaim.deleteMany({
    where: { userId: { in: userIds } },
  });

  if (teamIds.length > 0) {
    await prisma.teamJoinRequest.deleteMany({
      where: {
        OR: [{ teamId: { in: teamIds } }, { userId: { in: userIds } }],
      },
    });

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { teamId: null },
    });

    await prisma.team.deleteMany({
      where: { id: { in: teamIds } },
    });
  }

  await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
}

async function registerAndLogin(baseUrl, namespace, label, name) {
  const email = `${namespace}.${label}@tests.praha112.local`;
  const client = new SessionClient(baseUrl);

  await client.request("/api/auth/register", {
    method: "POST",
    json: {
      email,
      password: PASSWORD,
      name,
      registrationCode: REGISTRATION_CODE,
      privacyPolicyAccepted: true,
    },
    expectedStatus: 201,
  });

  await prisma.user.update({
    where: { email },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    },
  });

  await client.login(email, PASSWORD);

  const dbUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  assert(dbUser?.id, `Registrovaný uživatel ${email} nebyl nalezen v DB.`);

  return {
    email,
    userId: dbUser.id,
    client,
  };
}

async function getJoinRequest(teamId, userId) {
  const request = await prisma.teamJoinRequest.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
    select: { id: true, status: true },
  });

  assert(request?.id, "Žádost o vstup nebyla nalezena.");
  return request;
}

async function testCoreFlows(baseUrl, namespace) {
  const primary = await registerAndLogin(
    baseUrl,
    namespace,
    "primary",
    "Primary Flow",
  );

  const authenticatedProbe = await primary.client.request(
    "/api/uploads/selfie/view?key=selfies/tests/not-found.jpg",
    { expectedStatus: 404 },
  );
  assert(
    authenticatedProbe.payload?.message === "Selfie nebyla nalezena.",
    "Autentizovaný probe endpoint nevrátil očekávanou odpověď.",
  );

  const firstSelfieKey = `selfies/${namespace}/claim-primary.jpg`;
  const firstClaim = await primary.client.request("/api/districts/D001/claim", {
    method: "POST",
    json: {
      selfieUrl: firstSelfieKey,
      attestVisited: true,
      attestSignVisible: true,
    },
    expectedStatus: 201,
  });
  assert(
    firstClaim.payload?.claim?.districtCode === "D001",
    "První claim nevrátil očekávaný kód městské části.",
  );

  await primary.client.request("/api/districts/D001/claim", {
    method: "POST",
    json: {
      selfieUrl: firstSelfieKey,
      attestVisited: true,
      attestSignVisible: true,
    },
    expectedStatus: 409,
  });

  const leader = await registerAndLogin(baseUrl, namespace, "leader", "Team Leader");
  const memberA = await registerAndLogin(baseUrl, namespace, "member-a", "Member A");
  const memberB = await registerAndLogin(baseUrl, namespace, "member-b", "Member B");
  const memberC = await registerAndLogin(baseUrl, namespace, "member-c", "Member C");

  await leader.client.request(`/api/uploads/selfie/view?key=${encodeURIComponent(firstSelfieKey)}`, {
    expectedStatus: 404,
  });

  const teamCreate = await leader.client.request("/api/teams", {
    method: "POST",
    json: {
      name: `Integration Team ${namespace.slice(-8)}`,
    },
    expectedStatus: 201,
  });
  const createdTeam = teamCreate.payload?.team;
  assert(createdTeam?.id && createdTeam?.slug, "Vytvoření týmu nevrátilo id/slug.");

  const teamId = createdTeam.id;
  const teamSlug = createdTeam.slug;

  await memberA.client.request(`/api/teams/${teamSlug}/apply`, {
    method: "POST",
    expectedStatus: 200,
  });
  const approveRequest = await getJoinRequest(teamId, memberA.userId);
  assert(approveRequest.status === "PENDING", "Žádost člena A musí být ve stavu PENDING.");

  await leader.client.request(
    `/api/teams/${teamSlug}/requests/${approveRequest.id}/approve`,
    {
      method: "POST",
      expectedStatus: 200,
    },
  );

  const memberAAfterApprove = await prisma.user.findUnique({
    where: { id: memberA.userId },
    select: { teamId: true },
  });
  assert(
    memberAAfterApprove?.teamId === teamId,
    "Po schválení musí být člen A přiřazen do týmu.",
  );

  await memberB.client.request(`/api/teams/${teamSlug}/apply`, {
    method: "POST",
    expectedStatus: 200,
  });
  const rejectRequest = await getJoinRequest(teamId, memberB.userId);
  assert(rejectRequest.status === "PENDING", "Žádost člena B musí být ve stavu PENDING.");

  await leader.client.request(
    `/api/teams/${teamSlug}/requests/${rejectRequest.id}/reject`,
    {
      method: "POST",
      expectedStatus: 200,
    },
  );

  const rejectRequestAfter = await getJoinRequest(teamId, memberB.userId);
  assert(rejectRequestAfter.status === "REJECTED", "Žádost člena B měla být zamítnuta.");

  await leader.client.request(`/api/teams/${teamSlug}/members/${memberA.userId}/remove`, {
    method: "POST",
    expectedStatus: 200,
  });

  const memberAAfterRemove = await prisma.user.findUnique({
    where: { id: memberA.userId },
    select: { teamId: true },
  });
  assert(
    memberAAfterRemove?.teamId === null,
    "Po odebrání z týmu musí mít člen A teamId = null.",
  );

  await memberC.client.request(`/api/teams/${teamSlug}/apply`, {
    method: "POST",
    expectedStatus: 200,
  });
  const leaveRequest = await getJoinRequest(teamId, memberC.userId);
  await leader.client.request(
    `/api/teams/${teamSlug}/requests/${leaveRequest.id}/approve`,
    {
      method: "POST",
      expectedStatus: 200,
    },
  );

  await memberC.client.request(`/api/teams/${teamSlug}/leave`, {
    method: "POST",
    expectedStatus: 200,
  });

  const memberCAfterLeave = await prisma.user.findUnique({
    where: { id: memberC.userId },
    select: { teamId: true },
  });
  assert(
    memberCAfterLeave?.teamId === null,
    "Po opuštění týmu musí mít člen C teamId = null.",
  );

  await memberA.client.request(`/api/teams/${teamSlug}/apply`, {
    method: "POST",
    expectedStatus: 200,
  });
  const rejoinMemberARequest = await getJoinRequest(teamId, memberA.userId);
  await leader.client.request(
    `/api/teams/${teamSlug}/requests/${rejoinMemberARequest.id}/approve`,
    {
      method: "POST",
      expectedStatus: 200,
    },
  );

  await leader.client.request(`/api/teams/${teamSlug}/leader/${memberA.userId}/assign`, {
    method: "POST",
    expectedStatus: 200,
  });

  const leaderAfterAssign = await prisma.team.findUnique({
    where: { id: teamId },
    select: { leaderUserId: true },
  });
  assert(
    leaderAfterAssign?.leaderUserId === memberA.userId,
    "Po ručním předání musí být velitelem člen A.",
  );

  await leader.client.request(`/api/teams/${teamSlug}/leave`, {
    method: "POST",
    expectedStatus: 200,
  });

  const leaderAfterLeave = await prisma.user.findUnique({
    where: { id: leader.userId },
    select: { teamId: true },
  });
  assert(
    leaderAfterLeave?.teamId === null,
    "Původní velitel musí po opuštění týmu mít teamId = null.",
  );

  await memberB.client.request(`/api/teams/${teamSlug}/apply`, {
    method: "POST",
    expectedStatus: 200,
  });
  const memberBPromoteRequest = await getJoinRequest(teamId, memberB.userId);
  await memberA.client.request(
    `/api/teams/${teamSlug}/requests/${memberBPromoteRequest.id}/approve`,
    {
      method: "POST",
      expectedStatus: 200,
    },
  );

  await memberA.client.request(`/api/teams/${teamSlug}/leave`, {
    method: "POST",
    expectedStatus: 200,
  });

  const memberAAfterLeaderLeave = await prisma.user.findUnique({
    where: { id: memberA.userId },
    select: { teamId: true },
  });
  assert(
    memberAAfterLeaderLeave?.teamId === null,
    "Člen A (leader) musí po opuštění týmu mít teamId = null.",
  );

  const leaderAfterAutoTransfer = await prisma.team.findUnique({
    where: { id: teamId },
    select: { leaderUserId: true },
  });
  assert(
    leaderAfterAutoTransfer?.leaderUserId === memberB.userId,
    "Po odchodu leadera se má velení automaticky předat členu B.",
  );
}

async function main() {
  const namespace = buildNamespace();
  const port = await findAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  let server = null;

  try {
    await cleanupByNamespace(namespace);
    server = await startServer(baseUrl, port);

    await testCoreFlows(baseUrl, namespace);

    console.log("PASS test-integration-core-flows");
  } finally {
    await stopServer(server?.child ?? null);
    await cleanupByNamespace(namespace);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("FAIL test-integration-core-flows");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
