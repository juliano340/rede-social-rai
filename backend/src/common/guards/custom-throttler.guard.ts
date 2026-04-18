import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user;
    if (user && user.userId) {
      return `user_${user.userId}`;
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}
