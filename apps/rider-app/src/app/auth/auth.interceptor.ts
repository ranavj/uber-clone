import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  let token = null;
    
  if(isPlatformBrowser(platformId)){
    token = localStorage.getItem('token');
  }

  // Agar token hai, toh request clone karo aur header add karo
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Agar token nahi hai, toh original request jaane do
  return next(req);
};