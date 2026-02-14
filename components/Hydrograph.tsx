import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { HydroDataPoint, STATION_COLORS } from '../types';

interface HydrographProps {
  data: HydroDataPoint[];
  currentTime: number;
}

const Hydrograph: React.FC<HydrographProps> = ({ data, currentTime }) => {
  return (
    <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Limnigrammes Comparés</h3>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              angle={-45}
              textAnchor="end"
              height={50}
              interval="preserveStartEnd"
              minTickGap={25}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              domain={[0, 2.5]}
              label={{ value: 'Niveau (m)', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            
            <Line 
              type="monotone" 
              dataKey="stZacharie" 
              name="St Zacharie (S1)" 
              stroke={STATION_COLORS.stZacharie} 
              strokeWidth={3} 
              dot={false} 
            />
            <Line 
              type="monotone" 
              dataKey="roquevaire" 
              name="Roquevaire (S2)" 
              stroke={STATION_COLORS.roquevaire} 
              strokeWidth={2} 
              dot={false} 
            />
            <Line 
              type="monotone" 
              dataKey="aubagne" 
              name="Aubagne (S3)" 
              stroke={STATION_COLORS.aubagne} 
              strokeWidth={2} 
              dot={false} 
            />
            <Line 
              type="monotone" 
              dataKey="marseille" 
              name="Marseille" 
              stroke={STATION_COLORS.marseille} 
              strokeWidth={2} 
              dot={false} 
            />

            {/* Time Cursor */}
            <ReferenceLine x={data.find(d => d.time >= currentTime)?.label} stroke="#ef4444" strokeDasharray="3 3" />
            
            {/* Annotations based on PDF */}
            <ReferenceLine x={data.find(d => d.time >= 6)?.label} stroke="#94a3b8" strokeDasharray="2 2" label={{ position: 'top', value: '1. Ruissellement', fontSize: 10, fill: '#64748b' }} />
            <ReferenceLine x={data.find(d => d.time >= 16)?.label} stroke="#94a3b8" strokeDasharray="2 2" label={{ position: 'top', value: '2. Karst', fontSize: 10, fill: '#64748b' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-xs text-slate-500 space-y-1">
        <p><span className="font-bold text-slate-700">Phase 1 :</span> Détection en aval (Marseille) en premier due au ruissellement de surface.</p>
        <p><span className="font-bold text-slate-700">Phase 2 :</span> Restitution du Karst en amont (St Zacharie) ~11h30 après, se propageant vers l'aval.</p>
      </div>
    </div>
  );
};

export default Hydrograph;