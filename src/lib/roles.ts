export const PRIVILEGED_ROLES = ["ADMIN", "WC", "CC"] as const;
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];
