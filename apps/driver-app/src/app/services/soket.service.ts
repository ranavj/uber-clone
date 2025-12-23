import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
// 👇 Driver App ka Environment import karein
import { environment } from '../../environments/environment'; 

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // URL Logic
    const url = environment.rideApiUrl.replace('/api', ''); 
    
    this.socket = io(url, {
      autoConnect: false // Manual connect control
    });

    // Debugging Logs
    this.socket.on('connect', () => console.log('✅ Driver Socket Connected:', this.socket.id));
    this.socket.on('disconnect', () => console.log('❌ Driver Socket Disconnected'));
    this.socket.on('connect_error', (err) => console.error('⚠️ Socket Error:', err));
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

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  listen(eventName: string, callback: (data: any) => void) {
    this.socket.on(eventName, callback);
  }
}