// Every synced row gets a device-minted UUID and an updatedAt stamp.
// Centralised so the pattern is identical everywhere.

export const newId = (): string => crypto.randomUUID()

export const now = (): string => new Date().toISOString()

/** True for rows that have not been soft-deleted. */
export const isLive = <T extends { deletedAt?: string }>(row: T): boolean => !row.deletedAt