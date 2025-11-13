import type { RequestEvent } from "@builder.io/qwik-city";

export const SESSION_COOKIE_NAME = "scio.sid";
export const REFRESH_COOKIE_NAME = "scio.refresh";

interface CookieOptions {
  httpOnly: boolean;
  sameSite: "strict";
  secure: boolean;
  path: string;
  maxAge: number;
}

const secureDefaults: Omit<CookieOptions, "maxAge"> = {
  httpOnly: true,
  sameSite: "strict",
  secure: true,
  path: "/",
};

export function setSessionCookie(ev: RequestEvent, token: string, ttlSec: number): void {
  setCookie(ev, SESSION_COOKIE_NAME, token, ttlSec);
}

export function clearSessionCookie(ev: RequestEvent): void {
  clearCookie(ev, SESSION_COOKIE_NAME);
}

export function setRefreshCookie(ev: RequestEvent, token: string, ttlSec: number): void {
  setCookie(ev, REFRESH_COOKIE_NAME, token, ttlSec);
}

export function clearRefreshCookie(ev: RequestEvent): void {
  clearCookie(ev, REFRESH_COOKIE_NAME);
}

export function sendJsonError(ev: RequestEvent, status: number, body: { ok: false; error: string; code?: string; hint?: string }): void {
  ev.status(status);
  ev.json(status, body);
}

function setCookie(ev: RequestEvent, name: string, value: string, ttlSec: number): void {
  ev.cookie.set(name, value, { ...secureDefaults, maxAge: Math.max(ttlSec, 0) });
}

function clearCookie(ev: RequestEvent, name: string): void {
  ev.cookie.set(name, "", { ...secureDefaults, maxAge: 0 });
}
