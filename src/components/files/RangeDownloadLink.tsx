
import { $, component$, useSignal, type PropFunction } from "@builder.io/qwik";

interface RangeDownloadLinkProps {
  href: string;
  filename?: string;
  range?: { start?: number; end?: number };
  label?: string;
  onError$?: PropFunction<(message: string) => void>;
}

export const RangeDownloadLink = component$<RangeDownloadLinkProps>(
  ({ href, filename, range, label = "Download", onError$ }) => {
    const busy = useSignal(false);

    const triggerDownload$ = $(async () => {
      if (busy.value) {
        return;
      }
      busy.value = true;
      try {
        const headers: Record<string, string> = {};
        if (range && (typeof range.start === "number" || typeof range.end === "number")) {
          const headerValue = buildRangeHeader(range.start, range.end);
          if (headerValue) {
            headers.Range = headerValue;
          }
        }
        const response = await fetch(href, { headers });
        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = filename ?? "download";
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Download failed";
        if (onError$) {
          await onError$(message);
        } else {
          throw error;
        }
      } finally {
        busy.value = false;
      }
    });

    return (
      <button
        type="button"
        class="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:border-slate-400"
        disabled={busy.value}
        onClick$={triggerDownload$}
      >
        {busy.value ? "Downloading…" : label}
      </button>
    );
  },
);

const buildRangeHeader = (start?: number, end?: number): string => {
  const safeStart = typeof start === "number" && start >= 0 ? start : undefined;
  const safeEnd = typeof end === "number" && end >= 0 ? end : undefined;
  if (typeof safeStart === "number" && typeof safeEnd === "number") {
    return `bytes=${safeStart}-${safeEnd}`;
  }
  if (typeof safeStart === "number") {
    return `bytes=${safeStart}-`;
  }
  if (typeof safeEnd === "number") {
    return `bytes=-${safeEnd}`;
  }
  return "";
};

export default RangeDownloadLink;
