import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'; 
import { provideHotToastConfig } from '@ngneat/hot-toast';
import { authInterceptor } from './auth/auth.interceptor';
import { SOCKET_CONFIG } from '@uber-clone/socket-client';
import { environment } from '../environments/environment';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding(), withViewTransitions()),     
    provideHttpClient(withFetch(),withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideClientHydration(withEventReplay()) ,
    {
      provide: SOCKET_CONFIG,
      useValue: { 
        url: environment.rideApiUrl.replace('/api', '') // e.g. http://localhost:3002
      }
    },
    provideHotToastConfig({
      position: 'bottom-center', // Position set karein
      stacking: 'vertical',
      duration: 3000,
    })
  ],
};
