    import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // 1. Browser Check
  if (isPlatformBrowser(platformId)) {
    // ⚠️ Ensure karein ki key wahi ho jo Login ke waqt save ki thi ('uber_token' ya 'token')
    const token = localStorage.getItem('uber_token'); 

    // 2. Token Jodo
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // 🚨 Auto Logout Logic (Optional)
          if (error.status === 401) {
            console.error('Session Expired');
            // localStorage.removeItem('uber_token');
            // router.navigate(['/login']); 
          }
          return throwError(() => error);
        })
      );
    }
  }

  return next(req);
};