import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { HydroDataPoint, STATION_COLORS, STATION_COORDS } from '../types';
import L from 'leaflet';

// Fix Leaflet default icon issue in React (nécessaire pour le marker shadow par défaut si on utilisait le pin standard, 
// mais ici on utilise des DivIcons, on garde pour sécurité)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface StationMapProps {
  data: HydroDataPoint[];
  currentTime: number;
}

const StationMap: React.FC<StationMapProps> = ({ data, currentTime }) => {
  const currentData = data.find(d => d.time >= currentTime) || data[data.length - 1];

  // Fonction pour créer une icône "Limnimètre" personnalisée
  const createLimnimeterIcon = (level: number, color: string) => {
    // Echelle : Max visuel environ 3m -> 100% de la jauge
    const maxLevel = 3.0; 
    const percentage = Math.min((level / maxLevel) * 100, 100);
    
    // On utilise HTML string pour définir le style du tube
    // Le conteneur externe est le tube, le div interne est l'eau
    const html = `
      <div style="
        position: relative;
        width: 16px;
        height: 60px;
        background-color: rgba(255, 255, 255, 0.9);
        border: 2px solid #475569;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: flex-end;
      ">
        <div style="
          width: 100%;
          height: ${percentage}%;
          background-color: ${color};
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.9;
        "></div>
        
        <!-- Graduations décoratives -->
        <div style="position: absolute; right: 0; top: 10px; width: 4px; height: 1px; background: #94a3b8;"></div>
        <div style="position: absolute; right: 0; top: 20px; width: 4px; height: 1px; background: #94a3b8;"></div>
        <div style="position: absolute; right: 0; top: 30px; width: 4px; height: 1px; background: #94a3b8;"></div>
        <div style="position: absolute; right: 0; top: 40px; width: 4px; height: 1px; background: #94a3b8;"></div>
        <div style="position: absolute; right: 0; top: 50px; width: 4px; height: 1px; background: #94a3b8;"></div>
      </div>
      <div style="
        text-align: center; 
        font-size: 10px; 
        font-weight: bold; 
        background: white; 
        border-radius: 4px; 
        margin-top: 2px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        padding: 0 2px;
      ">${level.toFixed(2)}m</div>
    `;

    return L.divIcon({
      className: '!bg-transparent !border-0', // Override leaflet defaults
      html: html,
      iconSize: [30, 80], // Assez grand pour contenir le tube et le texte
      iconAnchor: [15, 80], // Ancre en bas au centre
      popupAnchor: [0, -70]
    });
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-md relative z-0">
      <MapContainer 
        center={[43.32, 5.55]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Utilisation de CartoDB Light pour un look plus "pro" et scientifique
        />
        
        {/* St Zacharie */}
        <Marker 
            position={STATION_COORDS.stZacharie as [number, number]} 
            icon={createLimnimeterIcon(currentData.stZacharie, STATION_COLORS.stZacharie)}
        >
          <Popup>
            <strong>St Zacharie</strong><br/>
            <span className="text-xs text-slate-500">Source (Amont)</span><br/>
            Niveau actuel: <span className="font-bold">{currentData.stZacharie.toFixed(2)}m</span>
          </Popup>
        </Marker>

        {/* Roquevaire */}
        <Marker 
            position={STATION_COORDS.roquevaire as [number, number]} 
            icon={createLimnimeterIcon(currentData.roquevaire, STATION_COLORS.roquevaire)}
        >
          <Popup>
            <strong>Roquevaire</strong><br/>
            Niveau actuel: <span className="font-bold">{currentData.roquevaire.toFixed(2)}m</span>
          </Popup>
        </Marker>

        {/* Aubagne */}
        <Marker 
            position={STATION_COORDS.aubagne as [number, number]} 
            icon={createLimnimeterIcon(currentData.aubagne, STATION_COLORS.aubagne)}
        >
          <Popup>
            <strong>Aubagne</strong><br/>
            Niveau actuel: <span className="font-bold">{currentData.aubagne.toFixed(2)}m</span>
          </Popup>
        </Marker>

        {/* Marseille */}
        <Marker 
            position={STATION_COORDS.marseille as [number, number]} 
            icon={createLimnimeterIcon(currentData.marseille, STATION_COLORS.marseille)}
        >
          <Popup>
            <strong>Marseille</strong><br/>
            <span className="text-xs text-slate-500">Embouchure (Aval)</span><br/>
            Niveau actuel: <span className="font-bold">{currentData.marseille.toFixed(2)}m</span>
          </Popup>
        </Marker>

      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md z-[1000] text-xs border border-slate-200">
          <h4 className="font-bold mb-3 text-slate-700 uppercase tracking-wide">Stations (Limnimètres)</h4>
          <div className="space-y-2">
             <div className="flex items-center gap-2">
               <div className="w-2 h-6 border border-slate-400 rounded-sm relative bg-slate-100 overflow-hidden">
                  <div className="absolute bottom-0 w-full h-3/4 bg-[#06b6d4]"></div>
               </div>
               <span>St Zacharie</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-6 border border-slate-400 rounded-sm relative bg-slate-100 overflow-hidden">
                  <div className="absolute bottom-0 w-full h-1/2 bg-[#22c55e]"></div>
               </div>
               <span>Roquevaire</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-6 border border-slate-400 rounded-sm relative bg-slate-100 overflow-hidden">
                  <div className="absolute bottom-0 w-full h-1/4 bg-[#f59e0b]"></div>
               </div>
               <span>Aubagne</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-6 border border-slate-400 rounded-sm relative bg-slate-100 overflow-hidden">
                  <div className="absolute bottom-0 w-full h-1/3 bg-[#3b82f6]"></div>
               </div>
               <span>Marseille</span>
             </div>
          </div>
          <div className="mt-3 text-slate-500 italic max-w-[150px] leading-tight">
            Les jauges indiquent le niveau d'eau en temps réel.
          </div>
      </div>
    </div>
  );
};

export default StationMap;