import type { RequestHandler } from "@builder.io/qwik-city";
import { clearRefreshCookie, clearSessionCookie } from "~/utils/http";

export const onPost: RequestHandler = async (ev) => {
  clearSessionCookie(ev);
  clearRefreshCookie(ev);
  ev.json(200, { ok: true });
};
