import { randomBytes, createHash } from 'node:crypto';
import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { authenticator } from 'otplib';
import type { AuthTokens } from '@aegis/types';
import { AuditLogger } from '@aegis/audit';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_LOGGER } from '../audit/audit.module';
import type { LoginDto, SignupDto } from './dto';

/**
 * Zero-knowledge auth (aegis §4, §5).
 *
 * The client derives auth_key + encryption_key locally from the password via
 * Argon2id. Only auth_key reaches us. We hash THAT again (server-side Argon2id)
 * so a DB leak never yields even the auth_key. encryption_key never leaves the
 * device, so the server can never decrypt vault/document data. (Principle #1.)
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(AUDIT_LOGGER) private readonly audit: AuditLogger,
  ) {}

  /** Public salt lookup so a client can derive keys before logging in. */
  async getSalt(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user?.clientSalt ?? null;
  }

  async signup(dto: SignupDto, ip: string | null): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Account already exists.');

    const authKeyHash = await argonHash(dto.authKey);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        authKeyHash,
        clientSalt: dto.salt,
        publicKey: dto.publicKey,
      },
    });

    await this.audit.emit({
      actorId: user.id,
      action: 'user.signup',
      targetType: 'user',
      targetId: user.id,
      ip,
    });

    return this.issueTokens(user.id, ip);
  }

  async login(dto: LoginDto, ip: string | null): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Constant-ish work whether or not the user exists (avoid enumeration).
    const ok = user
      ? await argonVerify(user.authKeyHash, dto.authKey).catch(() => false)
      : await argonVerify(DUMMY_HASH, dto.authKey).catch(() => false);

    if (!user || !ok) {
      await this.audit.emit({
        actorId: user?.id ?? null,
        action: 'user.login_failed',
        targetType: 'user',
        targetId: user?.id ?? null,
        ip,
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.mfaEnabled) {
      if (!dto.totp || !user.totpSecret) {
        throw new UnauthorizedException('TOTP required.');
      }
      const valid = authenticator.verify({
        token: dto.totp,
        secret: user.totpSecret,
      });
      if (!valid) throw new UnauthorizedException('Invalid TOTP.');
    }

    await this.audit.emit({
      actorId: user.id,
      action: 'user.login',
      targetType: 'user',
      targetId: user.id,
      ip,
    });

    return this.issueTokens(user.id, ip);
  }

  async refresh(refreshToken: string, ip: string | null): Promise<AuthTokens> {
    const tokenHash = sha256(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Rotation: revoke the old session, issue a fresh pair.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    await this.audit.emit({
      actorId: session.userId,
      action: 'session.refresh',
      targetType: 'session',
      targetId: session.id,
      ip,
    });
    return this.issueTokens(session.userId, ip);
  }

  private async issueTokens(
    userId: string,
    ip: string | null,
  ): Promise<AuthTokens> {
    const accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
    const refreshTtl = Number(process.env.JWT_REFRESH_TTL ?? 2592000);

    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessTtl,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: sha256(refreshToken),
        ip,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      accessExpiresAt: Math.floor(Date.now() / 1000) + accessTtl,
    };
  }
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

// A fixed valid Argon2id hash used to equalize timing for unknown accounts.
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$3s6l1Q9m0oP8oQm0oQm0oQm0oQm0oQm0oQm0oQm0oQ';
