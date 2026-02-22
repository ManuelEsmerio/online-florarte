// src/utils/tokenManager.ts

// Este módulo gestiona un token en memoria para evitar llamadas innecesarias a Firebase.
// Es solo para el lado del cliente.

let cachedToken: string | null = null;

export const getCachedToken = (): string | null => {
  return cachedToken;
};

export const saveToken = (token: string) => {
  cachedToken = token;
};

export const clearToken = () => {
  cachedToken = null;
};
