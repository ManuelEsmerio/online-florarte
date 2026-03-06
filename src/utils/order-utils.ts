/**
 * Extracts the owner userId from an order object returned by orderService.
 * Handles both camelCase (userId) and snake_case (user_id) field names.
 * Returns null for guest orders (no userId).
 */
export function getOrderOwnerUserId(order: unknown): number | null {
  const id = (order as any).user_id ?? (order as any).userId ?? null;
  return typeof id === 'number' ? id : null;
}

/**
 * Returns true if the given session user owns the order.
 * Guest orders (userId === null) are never owned by a logged-in user.
 */
export function assertOrderOwnership(order: unknown, sessionDbId: number): boolean {
  const ownerUserId = getOrderOwnerUserId(order);
  return ownerUserId !== null && ownerUserId === sessionDbId;
}
