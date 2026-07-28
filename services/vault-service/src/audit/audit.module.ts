import { Global, Module } from '@nestjs/common';
import { AuditLogger, ConsoleAuditSink, type AuditSink } from '@aegis/audit';
import { PrismaService } from '../prisma/prisma.service';

export const AUDIT_LOGGER = Symbol('AUDIT_LOGGER');

/** The shared @aegis/audit pipeline (principle #3), same as every service. */
@Global()
@Module({
  providers: [
    {
      provide: AUDIT_LOGGER,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => {
        const sinks: AuditSink[] = [new ConsoleAuditSink()];
        if (PrismaService.enabled) {
          sinks.push({
            name: 'postgres',
            write: async (event) => {
              await prisma.auditLog.create({
                data: {
                  actorId: event.actorId,
                  action: event.action,
                  targetType: event.targetType,
                  targetId: event.targetId,
                  ip: event.ip,
                  metadata: event.metadata ?? undefined,
                  timestamp: new Date(event.timestamp),
                },
              });
            },
          });
        }
        return new AuditLogger({
          sinks,
          onSinkError: (sink, err) =>
            // eslint-disable-next-line no-console
            console.error(`[audit] sink ${sink} failed`, err),
        });
      },
    },
  ],
  exports: [AUDIT_LOGGER],
})
export class AuditModule {}
