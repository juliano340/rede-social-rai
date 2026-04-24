import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // Token inválido ou ausente: não bloqueia, apenas não popula req.user
    }
    return true;
  }

  handleRequest(err: any, user: any) {
    return user || null;
  }
}
