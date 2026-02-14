import { HydroDataPoint } from './types';

// Generate interpolated data approximating the PDF curves
// T0 is start.
// Point 1 (Runoff): Marseille peaks early (~T+5), Aubagne (~T+6), Roquevaire (~T+7).
// Point 2 (Karst): St Zacharie starts ~T+12, peaks ~T+16. Wave moves down to Roquevaire (~T+17), Aubagne (~T+18).

const TOTAL_HOURS = 48;
const STEPS_PER_HOUR = 2;

export const SIMULATION_DATA: HydroDataPoint[] = [];

for (let i = 0; i <= TOTAL_HOURS * STEPS_PER_HOUR; i++) {
  const t = i / STEPS_PER_HOUR;
  
  // Base flow
  const base = 0.3;

  // 1. Runoff Component (Marine entry - hits mouth first)
  // Moves from Marseille (Downstream) -> Upstream
  const runoffMarseille = 0.4 * Math.exp(-Math.pow(t - 6, 2) / 8);
  const runoffAubagne = 0.5 * Math.exp(-Math.pow(t - 7, 2) / 8);
  const runoffRoquevaire = 0.6 * Math.exp(-Math.pow(t - 8, 2) / 8);
  const runoffStZacharie = 0.1 * Math.exp(-Math.pow(t - 9, 2) / 8); // Very little runoff upstream

  // 2. Karst Component (Aquifer discharge)
  // Starts at Source (St Zacharie) -> Moves Downstream
  // Delay ~11.5h for start, peak around 18h
  const karstStZacharie = 1.2 * Math.exp(-Math.pow(t - 16, 2) / 15); // The "Source"
  
  // Wave attenuation and delay downstream
  const karstRoquevaire = 1.3 * Math.exp(-Math.pow(t - 17.5, 2) / 18); // Amplified by terrain?
  const karstAubagne = 0.9 * Math.exp(-Math.pow(t - 19, 2) / 20);
  const karstMarseille = 0.4 * Math.exp(-Math.pow(t - 21, 2) / 25);

  // Composite heights
  const hMarseille = base + runoffMarseille + karstMarseille;
  const hAubagne = base + runoffAubagne + karstAubagne;
  const hRoquevaire = base + runoffRoquevaire + karstRoquevaire;
  const hStZacharie = base + runoffStZacharie + karstStZacharie;

  // Generate label (approximate dates based on PDF x-axis)
  const day = Math.floor(t / 24) + 9;
  const hour = Math.floor(t % 24);
  const min = Math.floor((t % 1) * 60);
  const label = `${day < 10 ? '0' + day : day}-02 ${hour < 10 ? '0' + hour : hour}:${min < 10 ? '0' + min : min}`;

  SIMULATION_DATA.push({
    time: t,
    label,
    stZacharie: hStZacharie,
    roquevaire: hRoquevaire,
    aubagne: hAubagne,
    marseille: hMarseille,
  });
}

export const MAX_TIME = TOTAL_HOURS;