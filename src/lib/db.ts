// src/lib/db.ts

// Mock types to replace mysql2/promise
export interface Pool {
  getConnection(): Promise<PoolConnection>;
  query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(sql: string, params?: any[]): Promise<[T, any]>;
  execute<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(sql: string, params?: any[]): Promise<[T, any]>;
}

export interface PoolConnection {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
  query<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(sql: string, params?: any[]): Promise<[T, any]>;
  execute<T extends RowDataPacket[][] | RowDataPacket[] | ResultSetHeader>(sql: string, params?: any[]): Promise<[T, any]>;
}

export interface RowDataPacket {
  [key: string]: any;
}

export interface ResultSetHeader {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  info: string;
  serverStatus: number;
  warningStatus: number;
}

// Global pool mock
declare global {
  var pool: Pool | null;
}

function getPool(): Pool {
  if (global.pool) {
    return global.pool;
  }

  // db.ts es un stub. Ningún código debería importar de aquí en producción.
  // Si ves este error, cambia el import a `@/lib/prisma` en el archivo afectado.
  throw new Error(
    '[db.ts] Este módulo es un stub no funcional. ' +
    'Usa `prisma` de `@/lib/prisma` para todas las operaciones de base de datos.'
  );
}

export async function dbWithAudit<T>(
  userId: number,
  queryFn: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const currentPool = getPool();
  const connection = await currentPool.getConnection();
  try {
    return await queryFn(connection);
  } catch (error) {
    console.error('Error in mock dbWithAudit:', error);
    throw error;
  } finally {
     connection.release();
  }
}

export default {
    query: (sql: string, params?: any[]) => getPool().query(sql, params),
    execute: (sql: string, params?: any[]) => getPool().execute(sql, params),
    getConnection: () => getPool().getConnection(),
};