import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth'; // Path check kar lena

export const authGuard = () => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }

  // Agar na Signal mila, na LocalStorage, tabhi Login par bhejo
  console.log('🛑 Access Denied: No Token found in Storage');
  return router.createUrlTree(['/login']);
};