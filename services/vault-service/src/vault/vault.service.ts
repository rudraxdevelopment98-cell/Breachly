import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogger } from '@aegis/audit';
import { AUDIT_LOGGER } from '../audit/audit.module';
import { VaultRepository, type VaultItemRow } from './vault.repository';
import type { UpsertVaultItemDto } from './dto';

/**
 * Vault items are stored and returned as ciphertext only. The server encrypts
 * and decrypts NOTHING — that all happens on the client with the user's
 * encryption_key. Every access is audit-logged (principle #3).
 */
@Injectable()
export class VaultService {
  constructor(
    private readonly repo: VaultRepository,
    @Inject(AUDIT_LOGGER) private readonly audit: AuditLogger,
  ) {}

  async list(ownerId: string, ip: string | null): Promise<VaultItemRow[]> {
    const items = await this.repo.list(ownerId);
    await this.audit.emit({
      actorId: ownerId,
      action: 'vault.item_read',
      targetType: 'vault_item',
      targetId: null,
      ip,
      metadata: { count: items.length },
    });
    return items;
  }

  async create(
    ownerId: string,
    dto: UpsertVaultItemDto,
    ip: string | null,
  ): Promise<VaultItemRow> {
    const item = await this.repo.create({ ownerId, ...dto });
    await this.audit.emit({
      actorId: ownerId,
      action: 'vault.item_written',
      targetType: 'vault_item',
      targetId: item.id,
      ip,
    });
    return item;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpsertVaultItemDto,
    ip: string | null,
  ): Promise<VaultItemRow> {
    const item = await this.repo.update(id, ownerId, dto);
    if (!item) throw new NotFoundException('Item not found.');
    await this.audit.emit({
      actorId: ownerId,
      action: 'vault.item_written',
      targetType: 'vault_item',
      targetId: id,
      ip,
    });
    return item;
  }

  async remove(ownerId: string, id: string, ip: string | null): Promise<void> {
    const ok = await this.repo.remove(id, ownerId);
    if (!ok) throw new NotFoundException('Item not found.');
    await this.audit.emit({
      actorId: ownerId,
      action: 'vault.item_written',
      targetType: 'vault_item',
      targetId: id,
      ip,
      metadata: { deleted: true },
    });
  }
}
