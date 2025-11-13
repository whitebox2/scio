interface MetricPayload {
  event: string;
  level?: "info" | "warn" | "error";
  [key: string]: unknown;
}

export function emitServerMetric(payload: MetricPayload): void {
  const body = {
    ts: new Date().toISOString(),
    level: payload.level ?? "info",
    ...payload,
  } satisfies MetricPayload;
  if (typeof process !== "undefined" && typeof process.stdout?.write === "function") {
    process.stdout.write(`${JSON.stringify(body)}\n`);
  }
}

export type ClientMetricListener = (payload: MetricPayload) => void;

const clientListeners = new Set<ClientMetricListener>();

export function onClientMetric(listener: ClientMetricListener): () => void {
  clientListeners.add(listener);
  return () => clientListeners.delete(listener);
}

export function emitClientMetric(payload: MetricPayload): void {
  clientListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // ignore
    }
  });
}
