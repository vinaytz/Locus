import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// Lightweight guard: any request with header `x-admin-token: <ADMIN_API_TOKEN>`
// is allowed. Set ADMIN_API_TOKEN in backend/.env. The Next.js admin app sends
// it via a server-side proxy so the secret never reaches the browser.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = process.env.ADMIN_API_TOKEN;
    if (!expected) {
      // Fail closed if the env var was never configured — never silently allow.
      throw new UnauthorizedException('Admin API not configured');
    }
    const provided = (req.headers['x-admin-token'] ?? '') as string;
    if (provided !== expected) throw new UnauthorizedException('Invalid admin token');
    return true;
  }
}
