export interface HydroDataPoint {
  time: number; // Hours from start
  label: string; // Display time string
  stZacharie: number;
  roquevaire: number;
  aubagne: number;
  marseille: number;
}

export interface SimulationState {
  currentTime: number; // Current time in hours
  isPlaying: boolean;
  playbackSpeed: number;
}

export enum FloodPhase {
  RAINFALL = 'RAINFALL',
  RUNOFF_PEAK = 'RUNOFF_PEAK',
  KARST_CHARGE = 'KARST_CHARGE',
  KARST_DISCHARGE = 'KARST_DISCHARGE',
  RECESSION = 'RECESSION'
}

export const STATION_COLORS = {
  stZacharie: '#06b6d4', // Cyan-500
  roquevaire: '#22c55e', // Green-500
  aubagne: '#f59e0b',    // Amber-500
  marseille: '#3b82f6',  // Blue-500
};

export const STATION_COORDS = {
  stZacharie: [43.385, 5.706],
  roquevaire: [43.349, 5.604],
  aubagne: [43.292, 5.570],
  marseille: [43.250, 5.375]
};