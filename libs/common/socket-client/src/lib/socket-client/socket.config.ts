import { InjectionToken } from '@angular/core';

export interface SocketConfig {
  url: string;
  options?: any;
}

// Yeh wo token hai jiske zariye App library ko URL dega
export const SOCKET_CONFIG = new InjectionToken<SocketConfig>('SOCKET_CONFIG');