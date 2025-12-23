import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Backend URL (e.g., http://localhost:3000)
    // Note: /api nahi lagana, socket root par connect hota hai
    const url = environment.rideApiUrl.replace('/api', ''); 
    
    this.socket = io(url, {
      autoConnect: false // Hum manually connect karenge jab user login hoga
    });
  }

  connect() {
    if (!this.socket.connected) {
      this.socket.connect();
      console.log('🔌 Connecting to WebSocket...');
      
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

  // Event bhejne ke liye
  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  // Event sunne ke liye
  listen(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }
}
