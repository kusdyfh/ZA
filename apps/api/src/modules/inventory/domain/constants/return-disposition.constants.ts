/**
 * Not a Prisma enum — this is an application-level choice, not a stored
 * column. A RESELLABLE disposition produces a RETURN movement; a DAMAGED
 * disposition produces a DAMAGED movement. See
 * docs/product/06-INVENTORY.md "Returns & Damaged Stock".
 */
export const RETURN_DISPOSITION = {
  RESELLABLE: 'RESELLABLE',
  DAMAGED: 'DAMAGED',
} as const;

export type ReturnDispositionValue = (typeof RETURN_DISPOSITION)[keyof typeof RETURN_DISPOSITION];
