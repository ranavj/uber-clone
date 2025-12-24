import { Injectable, Inject, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Import Zaroori hai
import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG, SocketConfig } from './socket.config';
import { SOCKET_EVENTS } from '@uber-clone/interfaces';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket;
  private platformId = inject(PLATFORM_ID); //  SSR Check ke liye

  constructor(@Inject(SOCKET_CONFIG) private config: SocketConfig) {
    console.log('🔌 Initializing Socket with URL:', config.url);

    // Socket Instance banaya (par abhi connect nahi hoga kyunki autoConnect: false hai)
    this.socket = io(config.url, {
      autoConnect: false,
      ...config.options
    });

    this.setupDebugListeners();
  }

  private setupDebugListeners() {
    this.socket.on('connect', () => console.log(`✅ WebSocket Connected! ID: ${this.socket.id}`));
    this.socket.on('disconnect', () => console.warn('❌ WebSocket Disconnected'));
    this.socket.on('connect_error', (err) => console.error('⚠️ WebSocket Error:', err));
  }

  connect() {
    // 1. Browser Check (Server par localStorage nahi hota)
    if (isPlatformBrowser(this.platformId)) {

      // 2. Token Nikalo
      const token = localStorage.getItem('uber_token');

      // 3. Token ko Socket Auth mein set karo
      // Yeh sabse zaroori step hai Refresh Persistence ke liye
      if (token) {
        this.socket.auth = { token };
      }
    }

    // 4. Connect karo
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  listen(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }

  ngOnDestroy() {
    this.disconnect();
  }
}