/**
 * Error thrown for user-facing business logic failures (validation, not found, etc.).
 * `errorHandler` in api-utils.ts will automatically use the real message
 * and a 4xx status code instead of the generic "Ocurrió un error inesperado."
 */
export class UserFacingError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'UserFacingError';
    this.statusCode = statusCode;
  }
}
