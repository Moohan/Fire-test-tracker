import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Setup mocks before any relative imports
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
  compare: vi.fn(),
}));

// 2. Import everything else
import { authorizeUser } from './auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

describe('authorizeUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null if credentials are invalid (missing password)', async () => {
    const result = await authorizeUser({ username: 'testuser' });
    expect(result).toBeNull();
  });

  it('should return null if user is not found in database', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await authorizeUser({ username: 'testuser', password: 'password123' });
    expect(result).toBeNull();
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });

  it('should return null if bcrypt compare fails', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: '1',
      username: 'testuser',
      passwordHash: 'hashed',
      role: 'USER',
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const result = await authorizeUser({ username: 'testuser', password: 'wrongpassword' });
    expect(result).toBeNull();
  });

  it('should return user object if credentials are valid', async () => {
    const user = {
      id: '1',
      username: 'testuser',
      passwordHash: 'hashed',
      role: 'USER',
    };
    (prisma.user.findUnique as any).mockResolvedValue(user);
    (bcrypt.compare as any).mockResolvedValue(true);

    const result = await authorizeUser({ username: 'testuser', password: 'password123' });
    expect(result).toEqual({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  });
});
