const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_POLICY_MESSAGE = 'La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.';

export function isPasswordStrong(password: unknown): password is string {
  return typeof password === 'string' && PASSWORD_POLICY_REGEX.test(password);
}

export function assertPasswordStrength(password: string) {
  if (!isPasswordStrong(password)) {
    const error = new Error(PASSWORD_POLICY_MESSAGE);
    (error as any).publicMessage = PASSWORD_POLICY_MESSAGE;
    throw error;
  }
}
