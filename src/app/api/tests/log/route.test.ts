import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { Equipment, TestLog } from "@prisma/client";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    equipment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    testLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

type MockTx = {
  testLog: { create: ReturnType<typeof vi.fn> };
  equipment: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
};

describe("POST /api/tests/log", () => {
  const mockUser = { id: "user-1", username: "testuser", role: "USER" };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: mockUser,
      expires: "2026-04-06T13:16:19.075Z",
    });
  });

  it("should return 401 if not authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "PASS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 404 if equipment not found", async () => {
    const mockTx: MockTx = {
      testLog: { create: vi.fn() },
      equipment: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return (cb as unknown as (tx: MockTx) => Promise<TestLog>)(mockTx);
    });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "PASS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("should set status to OFF_RUN if result is FAIL", async () => {
    const mockEquipment: Partial<Equipment> = {
      id: "eq-1",
      externalId: "EXT-1",
      name: "Eq 1",
      location: "Loc 1",
      procedurePath: null,
      status: "ON_RUN",
    };

    const mockLog: Partial<TestLog> = {
      id: "log-1",
      equipmentId: "eq-1",
      userId: "user-1",
      timestamp: new Date(),
      type: "VISUAL",
      result: "FAIL",
      notes: null,
    };

    const mockTx: MockTx = {
      testLog: { create: vi.fn().mockResolvedValue(mockLog as TestLog) },
      equipment: { findUnique: vi.fn().mockResolvedValue(mockEquipment as Equipment), update: vi.fn().mockResolvedValue({} as Equipment) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return (cb as unknown as (tx: MockTx) => Promise<TestLog>)(mockTx);
    });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "FAIL" }),
    });
    await POST(req);

    expect(mockTx.equipment.update).toHaveBeenCalledWith({
      where: { id: "eq-1" },
      data: { status: "OFF_RUN" },
    });
  });

  it("should set status to ON_RUN if type is ACCEPTANCE and result is PASS", async () => {
    const mockEquipment: Partial<Equipment> = {
      id: "eq-1",
      externalId: "EXT-1",
      name: "Eq 1",
      location: "Loc 1",
      procedurePath: null,
      status: "OFF_RUN",
    };

    const mockLog: Partial<TestLog> = {
      id: "log-1",
      equipmentId: "eq-1",
      userId: "user-1",
      timestamp: new Date(),
      type: "ACCEPTANCE",
      result: "PASS",
      notes: null,
    };

    const mockTx: MockTx = {
      testLog: { create: vi.fn().mockResolvedValue(mockLog as TestLog) },
      equipment: { findUnique: vi.fn().mockResolvedValue(mockEquipment as Equipment), update: vi.fn().mockResolvedValue({} as Equipment) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return (cb as unknown as (tx: MockTx) => Promise<TestLog>)(mockTx);
    });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "ACCEPTANCE", result: "PASS" }),
    });
    await POST(req);

    expect(mockTx.equipment.update).toHaveBeenCalledWith({
      where: { id: "eq-1" },
      data: { status: "ON_RUN" },
    });
  });

  it("should NOT clear OFF_RUN status if result is PASS but type is NOT ACCEPTANCE", async () => {
    const mockEquipment: Partial<Equipment> = {
      id: "eq-1",
      externalId: "EXT-1",
      name: "Eq 1",
      location: "Loc 1",
      procedurePath: null,
      status: "OFF_RUN",
    };

    const mockLog: Partial<TestLog> = {
      id: "log-1",
      equipmentId: "eq-1",
      userId: "user-1",
      timestamp: new Date(),
      type: "FUNCTIONAL",
      result: "PASS",
      notes: null,
    };

    const mockTx: MockTx = {
      testLog: { create: vi.fn().mockResolvedValue(mockLog as TestLog) },
      equipment: { findUnique: vi.fn().mockResolvedValue(mockEquipment as Equipment), update: vi.fn().mockResolvedValue({} as Equipment) },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (cb) => {
      return (cb as unknown as (tx: MockTx) => Promise<TestLog>)(mockTx);
    });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "FUNCTIONAL", result: "PASS" }),
    });
    await POST(req);

    expect(mockTx.equipment.update).not.toHaveBeenCalled();
  });
});
