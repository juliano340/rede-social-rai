import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '../shared/constants/api.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiUrl = API_URL.DEFAULT;
  
  if (req.url.startsWith(apiUrl)) {
    const cloned = req.clone({
      withCredentials: true,
    });
    return next(cloned);
  }

  return next(req);
};