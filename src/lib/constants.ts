export const ALLOWED_LOCATIONS = [
  "Cab",
  "pump locker",
  "driver's side front",
  "driver's side rear",
  "offside front",
  "offside rear",
] as const;

export type AllowedLocation = (typeof ALLOWED_LOCATIONS)[number];
