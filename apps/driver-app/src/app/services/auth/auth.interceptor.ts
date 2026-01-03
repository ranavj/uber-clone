    import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('uber_token'); 
    if (token) {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) console.error('Session Expired');
          return throwError(() => error);
        })
      );
    }
  }
  // ✅ FIX: Yeh hamesha req ko aage bhejega agar token nahi hai ya platform browser nahi hai
  return next(req);
};