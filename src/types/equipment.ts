export type Frequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
export type TestType = "VISUAL" | "FUNCTIONAL" | "NONE";
export type Status = "ON_RUN" | "OFF_RUN";

export interface EquipmentRequirement {
  id: string;
  equipmentId: string;
  frequency: Frequency;
  type: TestType;
}

export interface Equipment {
  id: string;
  externalId: string;
  name: string;
  location: string;
  category: string;
  procedurePath: string | null;
  status: Status;
  sfrsId: string | null;
  mfrId: string | null;
  expiryDate?: Date | string | null;
  statutoryExamination?: boolean;
  removedAt?: Date | string | null;
  requirements?: EquipmentRequirement[];
}
