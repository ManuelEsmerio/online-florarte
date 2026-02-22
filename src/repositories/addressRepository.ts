// src/repositories/addressRepository.ts
import type { Address } from '@/lib/definitions';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import db from '@/lib/db';

export const addressRepository = {
  /**
   * Crea o actualiza una dirección usando el Stored Procedure.
   * @param connection La conexión a la base de datos.
   * @param address Los datos de la dirección. Si address.id es 0 o no está definido, se creará una nueva.
   * @returns El ID de la dirección creada o actualizada.
   */
  async upsert(connection: PoolConnection, address: Partial<Address> & { user_id: number }): Promise<number> {
    const sql = 'CALL sp_Address_Upsert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @new_id)';
    await connection.query(sql, [
      address.id || 0,
      address.user_id,
      address.alias, 
      address.recipientName,
      address.phone,
      address.streetName,
      address.streetNumber,
      address.interiorNumber || null,
      address.neighborhood,
      address.city,
      address.state,
      null, // country
      address.postalCode,
      null, // latitude
      null, // longitude
      address.addressType,
      address.reference_notes || null
    ]);
    const [[{ new_id }]] = await connection.query('SELECT @new_id as new_id');
    return new_id as number;
  },

  /**
   * Realiza un borrado lógico de una dirección.
   * @param connection La conexión a la base de datos.
   * @param addressId El ID de la dirección a eliminar.
   * @returns `true` si la eliminación fue exitosa, `false` en caso contrario.
   */
  async softDelete(connection: PoolConnection, addressId: number): Promise<boolean> {
    const sql = 'UPDATE addresses SET is_deleted = 1, deleted_at = NOW() WHERE id = ?';
    const [result] = await connection.query<ResultSetHeader>(sql, [addressId]);
    return result.affectedRows > 0;
  }
};
