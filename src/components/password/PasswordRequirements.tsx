'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPasswordRequirementStatuses } from '@/utils/passwordPolicy';

type PasswordRequirementsProps = {
  password?: string;
  className?: string;
};

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  const statuses = getPasswordRequirementStatuses(password);

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 shadow-sm transition-colors duration-200',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Requisitos de contraseña"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Seguridad de la contraseña
      </p>
      <ul className="space-y-2 text-sm" aria-live="polite">
        {statuses.map((requirement) => (
          <li
            key={requirement.id}
            className={cn(
              'flex items-center gap-2 transition-colors duration-200',
              requirement.met ? 'text-emerald-600' : 'text-muted-foreground'
            )}
          >
            {requirement.met ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 transition-transform duration-200" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground/70 transition-transform duration-200" aria-hidden="true" />
            )}
            <span className="font-medium">{requirement.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
