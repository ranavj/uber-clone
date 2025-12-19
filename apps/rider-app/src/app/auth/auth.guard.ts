import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth'; // Class name 'Auth' hi hai na? Check karein.

export const authGuard = () => {
  const authService = inject(Auth);
  const router = inject(Router);
  
  const user = authService.currentUser();
  console.log('🛡️ Guard Checking User:', user); // 👈 Yeh Log lagayein

  if (user) {
    console.log('✅ Access Granted');
    return true;
  }

  console.log('🛑 Access Denied -> Redirecting to Login');
  router.navigate(['/login']);
  return false;
};