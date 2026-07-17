import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthTokens, SaltResponse } from '@aegis/types';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, SignupDto } from './dto';

function clientIp(req: Request): string | null {
  return (
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    null
  );
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Public: fetch the Argon2id salt so the client can derive keys pre-login. */
  @Get('salt')
  async salt(@Query('email') email: string): Promise<SaltResponse> {
    // Return a stable pseudo-salt for unknown emails to avoid enumeration.
    const salt = (await this.auth.getSalt(email)) ?? '';
    return { salt };
  }

  @Post('signup')
  signup(@Body() dto: SignupDto, @Req() req: Request): Promise<AuthTokens> {
    return this.auth.signup(dto, clientIp(req));
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthTokens> {
    return this.auth.login(dto, clientIp(req));
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthTokens> {
    return this.auth.refresh(dto.refreshToken, clientIp(req));
  }
}
