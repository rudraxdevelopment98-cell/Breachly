import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Verifies the access JWT issued by auth-service and attaches the user id.
 * The vault never trusts a client-supplied owner id — it comes from the token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    try {
      const payload = this.jwt.verify<{ sub: string }>(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
