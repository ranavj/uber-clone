import { Route } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { Login } from './login';
import { Signup } from './signup/signup';
import { Home } from './home';
import { History } from './history/history';
import { PaymentModalComponent } from './ui/payment.model/payment.model';

export const appRoutes: Route[] = [
    // 1. Public Routes
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
    {
        path: 'history',
        component: History,
        canActivate: [authGuard]
    },
    {
        path: 'wallet',
        component: PaymentModalComponent,
        canActivate: [authGuard]
    },
    {
        path: '',
        component: Home,
        canActivate: [authGuard],
        // Iska matlab: Sirf tab Home kholo jab URL exact empty ho.
        // Agar yeh nahi lagaya toh '/history' bhi Home khol dega.
        pathMatch: 'full'
    },



    // 3. Fallback
    { path: '**', redirectTo: '' }
];