import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { environment } from '../environments/environment';
import { SOCKET_CONFIG } from '@uber-clone/socket-client';
import { authInterceptor } from './services/auth/auth.interceptor';
export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) // 👈 YEH LINE ZAROORI HAI
    ),
    {
      provide: SOCKET_CONFIG,
      useValue: { 
        url: environment.rideApiUrl.replace('/api', ''), // http://localhost:3002
        options: {
           // Agar driverId handshake mein bhejna ho toh yahan query add kar sakte hain
           // query: { type: 'driver' } 
        }
      }
    }
  ],
};
