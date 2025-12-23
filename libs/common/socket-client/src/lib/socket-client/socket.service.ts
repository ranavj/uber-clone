import { Injectable, Inject, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
// ✅ Import Config Token
import { SOCKET_CONFIG, SocketConfig } from './socket.config';
// ✅ Import Events Interface
import { SOCKET_EVENTS } from '@uber-clone/interfaces';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket;

  // 👇 Constructor mein Config Inject karwaya
  constructor(@Inject(SOCKET_CONFIG) private config: SocketConfig) {
    console.log('🔌 Initializing Socket with URL:', config.url);
    
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
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Type-Safe Emit
  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  // Type-Safe Listen
  listen(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }
  
  // Clean up
  ngOnDestroy() {
    this.disconnect();
  }
}