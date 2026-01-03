export const SOCKET_EVENTS = {
  // Driver Updates
  UPDATE_DRIVER_LOCATION: 'updateDriverLocation',
  
  // Ride Flow
  NEW_RIDE_AVAILABLE: 'new-ride-available',
  RIDE_ACCEPTED: 'ride-accepted',
  RIDE_CANCELLED: 'RIDE_CANCELLED',
  
  // Dynamic Events (Function jo ID lekar event name banaye)
  RIDE_STATUS_UPDATE: (rideId: string) => `ride-status-${rideId}`,
  DRIVER_LOCATION_UPDATE: (rideId: string) => `driver-location-${rideId}`,

  //  Wallet Event
  WALLET_UPDATE: 'WALLET_UPDATE'
};