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
  
  console.log('Using Mock DB Pool');
  global.pool = {
    getConnection: async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async () => [[], {}],
      execute: async () => [[], {}]
    } as unknown as PoolConnection),
    query: async () => [[], {}],
    execute: async () => [[], {}]
  } as unknown as Pool;

  return global.pool;
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