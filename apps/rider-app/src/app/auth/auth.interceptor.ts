import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
// ✅ Updated: ngx-sonner static import
import { toast } from 'ngx-sonner'; 

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  // 🛡️ Addon 1: External APIs (Google Maps) par Token mat bhejo
  if (req.url.includes('googleapis.com')) {
    return next(req);
  }

  let authReq = req;

  // 1. Browser Check
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('uber_token');

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
        
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('uber_token');
          localStorage.removeItem('uber_user');
        }
        
        toast.error('Session Expired', { 
          description: 'Please login again to continue.' 
        });
        router.navigate(['/login']);
      } 
      
      // 🚨 Addon 3: Global Error Messages
      else if (error.status === 0) {
        toast.error('Network Error', { 
          description: 'Internet connection lost! 📶' 
        });
      } 
      else if (error.status >= 500) {
        toast.error('Server Error', { 
          description: 'Server is down! Please try later. 🔥' 
        });
      }
      else {
        // Baaki chote-mote errors (400, 404)
        const message = error.error?.message || 'Something went wrong';
        toast.error(message);
      }

      // Error ko wapas phenk do taaki component bhi handle kar sake
      return throwError(() => error);
    })
  );
};