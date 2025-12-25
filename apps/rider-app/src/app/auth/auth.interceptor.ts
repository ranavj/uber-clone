import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HotToastService } from '@ngneat/hot-toast'; // 🍞 Toast Service

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const toast = inject(HotToastService); // Toast Inject kiya

  // 🛡️ Addon 1: External APIs (Google Maps) par Token mat bhejo
  if (req.url.includes('googleapis.com')) {
    return next(req);
  }

  let authReq = req;

  // 1. Browser Check
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('uber_token'); // ⚠️ Name check kar lena

    // 2. Token Jodo
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  // 3. Request Bhejo aur Errors Pakdo
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // 🚨 Addon 2: Auto Logout (401 Unauthorized)
      if (error.status === 401) {
        console.warn('Session Expired. Logging out...');
        
        // Agar browser hai toh safayi karo
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('uber_token');
          localStorage.removeItem('uber_user');
        }
        
        toast.error('Session Expired. Please Login again.'); // Toast dikhaya
        router.navigate(['/login']); // Login par bheja
      } 
      
      // 🚨 Addon 3: Global Error Messages
      else if (error.status === 0) {
        toast.error('Internet connection lost! 📶');
      } 
      else if (error.status >= 500) {
        toast.error('Server is down! Please try later. 🔥');
      }
      else {
        // Baaki chote-mote errors (400, 404)
        const message = error.error?.message || 'Something went wrong';
        toast.error(message);
      }

      // Error ko wapas phenk do taaki component bhi handle kar sake agar chahe
      return throwError(() => error);
    })
  );
};