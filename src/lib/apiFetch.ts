// src/lib/apiFetch.ts

/**
 * Un simple wrapper alrededor de `fetch` que establece el Content-Type por defecto a JSON.
 * Ya no maneja la lógica de autenticación; esa responsabilidad se ha movido al `AuthContext`.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    if (!headers.hasOwnProperty('Content-Type')) {
      (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
  }

  return fetch(url, { ...options, headers });
}
