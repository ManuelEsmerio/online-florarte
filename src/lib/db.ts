// src/lib/db.ts
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection } from 'mysql2/promise';

// Declara una variable global para el pool.
// Esto es clave para reutilizar la misma instancia en un entorno serverless.
declare global {
  var pool: Pool | null;
}

function getPool(): Pool {
  // Si el pool ya existe en el ámbito global, lo reutilizamos.
  if (global.pool) {
    return global.pool;
  }
  
  // Si no, creamos uno nuevo y lo asignamos a la variable global.
  console.log("Creando un nuevo pool de conexiones MySQL...");
  global.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return global.pool;
}

export async function dbWithAudit<T>(
  userId: number,
  queryFn: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  let connection: PoolConnection | undefined;
  const currentPool = getPool();
  try {
    connection = await currentPool.getConnection();
    await connection.beginTransaction(); // Iniciar transacción
    await connection.query('SET @audit_user_id = ?', [userId]);
    
    const result = await queryFn(connection);
    
    await connection.commit(); // Confirmar transacción
    return result;
  } catch (error) {
    if (connection) {
      await connection.rollback(); // Revertir en caso de error
    }
    console.error("Error en la transacción auditada:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.query('SET @audit_user_id = NULL');
      connection.release();
    }
  }
}

export default {
    query: (sql: string, params?: any[]) => getPool().query(sql, params),
    execute: (sql: string, params?: any[]) => getPool().execute(sql, params),
    getConnection: () => getPool().getConnection(),
};
