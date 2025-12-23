import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Ride } from '@uber-clone/interfaces';
import { RideService } from '../services/ride.services';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History implements OnInit {
  private rideService = inject(RideService);
  
  // Rides ka data yahan aayega
  rides = signal<Ride[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.rideService.getHistory().subscribe({
      next: (data) => {
        console.log('📜 History Data:', data);
        this.rides.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
      }
    });
  }
}