import { Route } from '@angular/router';
import { Login } from './login';
import { Signup } from './signup/signup';
import { Home } from './home';

export const appRoutes: Route[] = [
    { path: '', component: Login }, // Home = Login Page
    { path: 'signup', component: Signup },
    { path: 'home', component: Home }
];
