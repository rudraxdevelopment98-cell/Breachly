import type { AuditAction, AuditEvent, AuditTargetType } from '@aegis/types';

/**
 * @aegis/audit — the one audit pipeline every service writes to (principle #3:
 * every access to sensitive data must be audit-logged).
 *
 * Design goals:
 *  - Append-only, tamper-evident intent (hash-chaining hook left for later).
 *  - Pluggable sinks so the same events fan out to Postgres AND a SIEM-style
 *    stream (the detection-dashboard angle in aegis §1 / §4).
 *  - NEVER accept plaintext secrets — metadata is structured, non-sensitive.
 */

export type { AuditAction, AuditEvent, AuditTargetType };

/** A destination for audit events (DB table, SIEM stream, stdout, etc.). */
export interface AuditSink {
  name: string;
  write(event: AuditEvent): Promise<void> | void;
}

export interface EmitInput {
  actorId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string | null;
  ip?: string | null;
  metadata?: AuditEvent['metadata'];
}

export interface AuditClock {
  nowIso(): string;
}

const systemClock: AuditClock = { nowIso: () => new Date().toISOString() };

/**
 * Fan-out logger. Construct once per service with the sinks it needs, then call
 * `emit()` at every sensitive access. Sink failures are isolated so one broken
 * sink never drops the event from the others (and never breaks the request).
 */
export class AuditLogger {
  private readonly sinks: AuditSink[];
  private readonly clock: AuditClock;
  private readonly onSinkError?: (sink: string, err: unknown) => void;

  constructor(opts: {
    sinks: AuditSink[];
    clock?: AuditClock;
    onSinkError?: (sink: string, err: unknown) => void;
  }) {
    this.sinks = opts.sinks;
    this.clock = opts.clock ?? systemClock;
    this.onSinkError = opts.onSinkError;
  }

  async emit(input: EmitInput): Promise<void> {
    const event: AuditEvent = {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      ip: input.ip ?? null,
      metadata: input.metadata,
      timestamp: this.clock.nowIso(),
    };

    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.write(event);
        } catch (err) {
          this.onSinkError?.(sink.name, err);
        }
      }),
    );
  }
}

/** Structured JSON-to-stdout sink — ready to ship into a SIEM/log pipeline. */
export class ConsoleAuditSink implements AuditSink {
  name = 'console';
  write(event: AuditEvent): void {
    // One JSON object per line = easy to ingest (KQL/Splunk/Elastic).
    console.log(JSON.stringify({ kind: 'audit', ...event }));
  }
}

/** In-memory sink for tests. */
export class MemoryAuditSink implements AuditSink {
  name = 'memory';
  readonly events: AuditEvent[] = [];
  write(event: AuditEvent): void {
    this.events.push(event);
  }
}
