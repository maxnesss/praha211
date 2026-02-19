export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Praha211</h1>
      <div className="mt-4 max-w-2xl space-y-2 text-sm text-neutral-600">
        <p>
          Prisma + PostgreSQL is configured. Update models in{" "}
          <code>prisma/schema.prisma</code>.
        </p>
        <p>
          Check DB connectivity at <code>/api/health/db</code>.
        </p>
      </div>
    </main>
  );
}
