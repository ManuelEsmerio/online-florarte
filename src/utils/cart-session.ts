
'use client';

// Ejecutar SOLO en cliente (window disponible)
const KEY = 'cart_session_id';
const COOKIE = 'session_id';
const UUID_RE = /^[0-9a-fA-F-]{10,64}$/;

function genId() {
  return (globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days*24*60*60*1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[-.[\]{}()*+?^$|]/g, '\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Crea/sincroniza y devuelve SIEMPRE el mismo cart_session_id. */
export function ensureCartSessionId(): string {
  if (typeof window === 'undefined') return ''; // SSR guard
  let id = localStorage.getItem(KEY) || '';
  if (!id || !UUID_RE.test(id)) {
    id = genId();
    localStorage.setItem(KEY, id);
  }
  const cookieId = getCookie(COOKIE);
  if (cookieId !== id) {
    setCookie(COOKIE, id); // sincroniza cookie -> backend leerá este session_id
  }
  return id;
}

/** Lee sin crear (por si solo quieres consultarlo en cliente). */
export function getCartSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(KEY);
  return id && UUID_RE.test(id) ? id : null;
}
