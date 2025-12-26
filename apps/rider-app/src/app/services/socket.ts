import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // 🛠️ FIX: Gateway URL (http://localhost:3000)
    // environment.rideApiUrl = 'http://localhost:3000/api'
    // .replace('/api', '') => 'http://localhost:3000'
    const url = environment.rideApiUrl.replace('/api', ''); 
    
    this.socket = io(url, {
      autoConnect: false,
      transports: ['websocket'] // Force websocket for better performance
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
      console.log('🔌 Connecting to WebSocket at 3000...');
      
      this.socket.on('connect', () => {
        console.log('✅ WebSocket Connected! ID:', this.socket.id);
      });
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
}