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
      withInterceptors([authInterceptor])
    ),
    {
      provide: SOCKET_CONFIG,
      useValue: {
        url: 'http://localhost:3000', // Gateway URL
        options: {
          transports: ['websocket'],
          auth: {
            token: typeof window !== 'undefined' ? localStorage.getItem('uber_token') : null
          },
          // 🚀 Zaroori: Isse CORS errors kam aate hain socket level par
          extraHeaders: {
            "Access-Control-Allow-Origin": "*"
          }
        }
      }
    }
  ],
};
