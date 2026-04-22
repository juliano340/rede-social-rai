import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/app.constants';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast = inject(ToastService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const status = error.status;

      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          authService.logout();
          router.navigate(['/login']);
          toast.error(ERROR_MESSAGES[HTTP_STATUS.UNAUTHORIZED]);
          break;

        case HTTP_STATUS.FORBIDDEN:
          toast.error(ERROR_MESSAGES[HTTP_STATUS.FORBIDDEN]);
          break;

        case HTTP_STATUS.NOT_FOUND:
          if (!isSilent404(error.url)) {
            toast.error(ERROR_MESSAGES[HTTP_STATUS.NOT_FOUND]);
          }
          break;

        case HTTP_STATUS.TOO_MANY_REQUESTS:
          toast.error(ERROR_MESSAGES[HTTP_STATUS.TOO_MANY_REQUESTS]);
          break;

        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          toast.error(ERROR_MESSAGES[HTTP_STATUS.INTERNAL_SERVER_ERROR]);
          break;

        case 0:
          toast.error('Não foi possível conectar ao servidor. Verifique sua conexão.');
          break;

        default:
          if (status >= 400) {
            const message = error.error?.message || ERROR_MESSAGES.DEFAULT;
            toast.error(message);
          }
      }

      return throwError(() => error);
    })
  );
};

function isSilent404(url: string | null): boolean {
  if (!url) return false;
  const silentPatterns = ['/api/notifications/unread-count'];
  return silentPatterns.some(pattern => url.includes(pattern));
}
