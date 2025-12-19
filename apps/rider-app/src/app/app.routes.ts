import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard'; // 👈 Guard import karein
import { Home } from './home';
import { Login } from './login';
import { Signup } from './signup/signup';

export const appRoutes: Route[] = [
    // 1. Public Routes (Sabke liye khule hain)
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },

    // 2. Protected Route (Sirf Logged In users ke liye)
    { 
        path: '', 
        component: Home, 
        canActivate: [authGuard] // 🛡️ Yahan Security Guard khada kar diya
    },

    // 3. Fallback: Agar kuch ulti-seedhi URL dale toh Home (ya Login) par bhejo
    { path: '**', redirectTo: '' }
];