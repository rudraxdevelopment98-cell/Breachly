import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface VaultItemRow {
  id: string;
  ownerId: string;
  type: string;
  ciphertext: string;
  nonce: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewVaultItem {
  ownerId: string;
  type: string;
  ciphertext: string;
  nonce: string;
}

/**
 * Storage for vault items. Backed by Postgres when VAULT_DATABASE_URL is set,
 * otherwise an in-memory Map so the service runs with zero infra in dev.
 * Either way it only ever holds ciphertext — never plaintext (principle #1).
 */
@Injectable()
export class VaultRepository {
  private readonly mem = new Map<string, VaultItemRow>();
  private seq = 0;

  constructor(private readonly prisma: PrismaService) {}

  private get usingDb(): boolean {
    return PrismaService.enabled;
  }

  async list(ownerId: string): Promise<VaultItemRow[]> {
    if (this.usingDb) {
      const rows = await this.prisma.vaultItem.findMany({
        where: { ownerId },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(toRow);
    }
    return [...this.mem.values()]
      .filter((r) => r.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async create(input: NewVaultItem): Promise<VaultItemRow> {
    if (this.usingDb) {
      const row = await this.prisma.vaultItem.create({ data: input });
      return toRow(row);
    }
    const now = new Date().toISOString();
    const row: VaultItemRow = {
      id: `mem_${++this.seq}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.mem.set(row.id, row);
    return row;
  }

  async update(
    id: string,
    ownerId: string,
    patch: { type?: string; ciphertext: string; nonce: string },
  ): Promise<VaultItemRow | null> {
    if (this.usingDb) {
      const existing = await this.prisma.vaultItem.findFirst({
        where: { id, ownerId },
      });
      if (!existing) return null;
      const row = await this.prisma.vaultItem.update({
        where: { id },
        data: patch,
      });
      return toRow(row);
    }
    const existing = this.mem.get(id);
    if (!existing || existing.ownerId !== ownerId) return null;
    const row: VaultItemRow = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.mem.set(id, row);
    return row;
  }

  async remove(id: string, ownerId: string): Promise<boolean> {
    if (this.usingDb) {
      const existing = await this.prisma.vaultItem.findFirst({
        where: { id, ownerId },
      });
      if (!existing) return false;
      await this.prisma.vaultItem.delete({ where: { id } });
      return true;
    }
    const existing = this.mem.get(id);
    if (!existing || existing.ownerId !== ownerId) return false;
    return this.mem.delete(id);
  }
}

function toRow(r: {
  id: string;
  ownerId: string;
  type: string;
  ciphertext: string;
  nonce: string;
  createdAt: Date;
  updatedAt: Date;
}): VaultItemRow {
  return {
    id: r.id,
    ownerId: r.ownerId,
    type: r.type,
    ciphertext: r.ciphertext,
    nonce: r.nonce,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
