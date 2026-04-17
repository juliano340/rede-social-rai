import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = 'http://localhost:3000';
  
  if (req.url.startsWith(apiUrl)) {
    const cloned = req.clone({
      withCredentials: true,
    });
    return next(cloned);
  }

  return next(req);
};