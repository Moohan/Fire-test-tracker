import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    equipment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    testLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(prisma)),
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("POST /api/tests/log", () => {
  const mockUser = { id: "user-1", username: "testuser", role: "USER" };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue({ user: mockUser });
  });

  it("should return 401 if not authenticated", async () => {
    (getServerSession as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "PASS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should return 404 if equipment not found", async () => {
    (prisma.equipment.findUnique as any).mockResolvedValue(null);
    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "PASS" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("should set status to OFF_RUN if result is FAIL", async () => {
    (prisma.equipment.findUnique as any).mockResolvedValue({ id: "eq-1", status: "ON_RUN" });
    (prisma.testLog.create as any).mockResolvedValue({ id: "log-1" });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "VISUAL", result: "FAIL" }),
    });
    await POST(req);

    expect(prisma.equipment.update).toHaveBeenCalledWith({
      where: { id: "eq-1" },
      data: { status: "OFF_RUN" },
    });
  });

  it("should set status to ON_RUN if type is ACCEPTANCE and result is PASS", async () => {
    (prisma.equipment.findUnique as any).mockResolvedValue({ id: "eq-1", status: "OFF_RUN" });
    (prisma.testLog.create as any).mockResolvedValue({ id: "log-1" });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "ACCEPTANCE", result: "PASS" }),
    });
    await POST(req);

    expect(prisma.equipment.update).toHaveBeenCalledWith({
      where: { id: "eq-1" },
      data: { status: "ON_RUN" },
    });
  });

  it("should NOT clear OFF_RUN status if result is PASS but type is NOT ACCEPTANCE", async () => {
    (prisma.equipment.findUnique as any).mockResolvedValue({ id: "eq-1", status: "OFF_RUN" });
    (prisma.testLog.create as any).mockResolvedValue({ id: "log-1" });

    const req = new Request("http://localhost/api/tests/log", {
      method: "POST",
      body: JSON.stringify({ equipmentId: "eq-1", type: "FUNCTIONAL", result: "PASS" }),
    });
    await POST(req);

    expect(prisma.equipment.update).not.toHaveBeenCalled();
  });
});
