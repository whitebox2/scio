import type { RequestHandler } from "@builder.io/qwik-city";

const START_TS = Date.now();

export const onGet: RequestHandler = async ({ json }) => {
  // These are read from env; inject at runtime via container/orchestrator.
  const version = process.env.SCIO_VERSION ?? "dev";
  const commitSha = process.env.SCIO_COMMIT_SHA ?? "dev";
  const mode = process.env.SCIO_MODE ?? "dev";
  const uptimeSec = Math.floor((Date.now() - START_TS) / 1000);

  json(200, {
    status: "ok",
    mode,
    version,
    commitSha,
    uptimeSec,
    // Reserved fields for future readiness checks (e.g., DB ping):
    checks: { db: "skipped", objectStore: "skipped" },
  });
};
