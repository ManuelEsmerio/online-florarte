type PasswordRequirement = {
  id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (password) => password.length >= 8 },
  { id: 'uppercase', label: 'Al menos una letra mayúscula', test: (password) => /[A-Z]/.test(password) },
  { id: 'lowercase', label: 'Al menos una letra minúscula', test: (password) => /[a-z]/.test(password) },
  { id: 'number', label: 'Al menos un número', test: (password) => /\d/.test(password) },
  { id: 'special', label: 'Al menos un carácter especial', test: (password) => /[^A-Za-z0-9]/.test(password) },
];

export const PASSWORD_POLICY_MESSAGE = 'La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y un carácter especial.';

export type PasswordRequirementStatus = {
  id: PasswordRequirement['id'];
  label: string;
  met: boolean;
};

export function getPasswordRequirementStatuses(password?: string): PasswordRequirementStatus[] {
  const candidate = typeof password === 'string' ? password : '';
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    met: requirement.test(candidate),
  }));
}

export function isPasswordStrong(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password))
  );
}

export function assertPasswordStrength(password: string) {
  if (!isPasswordStrong(password)) {
    const error = new Error(PASSWORD_POLICY_MESSAGE);
    (error as any).publicMessage = PASSWORD_POLICY_MESSAGE;
    throw error;
  }
}
