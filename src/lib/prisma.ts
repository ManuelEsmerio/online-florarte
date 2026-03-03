import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Deshabilitar query logging en producción (ahorra overhead de serialización)
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
  });

// En desarrollo: reutilizar la instancia entre hot-reloads para no agotar conexiones.
// En producción: Next.js mantiene el módulo cargado entre requests, el singleton funciona.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
