
import React, { useState, useEffect, useRef } from 'react';
import { ActivityType } from '../types';

interface RecordOverlayProps {
  onClose: () => void;
}

const RecordOverlay: React.FC<RecordOverlayProps> = ({ onClose }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.RUN);
  const [distance, setDistance] = useState(0); 
  const [lastPos, setLastPos] = useState<GeolocationCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'IDLE' | 'SEARCHING' | 'LOCKED' | 'ERROR'>('IDLE');
  
  const watchId = useRef<number | null>(null);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      setGpsStatus('SEARCHING');
      interval = setInterval(() => setSeconds((s) => s + 1), 1000);
      
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (position) => {
            setGpsStatus('LOCKED');
            if (lastPos) {
              const d = calculateDistance(
                lastPos.latitude, lastPos.longitude,
                position.coords.latitude, position.coords.longitude
              );
              if (d < 0.5) setDistance(prev => prev + d);
            }
            setLastPos(position.coords);
          },
          (err) => {
            console.error(err);
            setGpsStatus('ERROR');
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    } else {
      clearInterval(interval);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      setGpsStatus('IDLE');
    }
    return () => {
      clearInterval(interval);
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [isActive, lastPos]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    triggerHaptic(isActive ? [30, 20, 30] : [10, 60]);
    setIsActive(!isActive);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stupid-black flex flex-col animate-in slide-in-from-bottom duration-500 pt-safe pb-safe overflow-hidden">
      {/* HEADER */}
      <div className="px-6 pt-safe-overlay pb-5 flex justify-between items-center border-b border-white/5 bg-stupid-card/50">
        <button onClick={onClose} className="size-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/40">close</span>
        </button>
        <div className="text-right">
          <p className="text-stupid-purple font-black uppercase tracking-widest italic text-2xl leading-none">RECORDING</p>
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className={`size-2 rounded-full ${gpsStatus === 'LOCKED' ? 'bg-stupid-neon shadow-[0_0_8px_#CCFF00]' : 'bg-red-500 animate-pulse'}`}></span>
            <p className="text-[10px] uppercase font-black text-white/40 tracking-widest">GPS {gpsStatus}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-8 text-center bg-gradient-to-b from-stupid-card/50 to-stupid-black overflow-y-auto no-scrollbar">
        {/* TYPE SELECTOR */}
        {!isActive && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar w-full mb-10 pb-2">
            {[ActivityType.RUN, ActivityType.RIDE, ActivityType.HIKE, ActivityType.WALK].map(type => (
              <button 
                key={type}
                onClick={() => { triggerHaptic(5); setActivityType(type); }}
                className={`px-6 py-4 rounded-2xl border-2 whitespace-nowrap text-xs font-black uppercase italic tracking-widest transition-all ${
                  activityType === type ? 'bg-stupid-purple border-stupid-purple text-white shadow-xl shadow-stupid-purple/20' : 'border-white/5 bg-stupid-card text-white/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {/* CLOCK */}
        <div className="mt-4 mb-6 relative">
          <p className="text-[72px] sm:text-[110px] font-display font-black leading-none italic tracking-tighter text-white tabular-nums drop-shadow-2xl">
            {formatTime(seconds)}
          </p>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
             <div className="h-[2px] w-8 bg-stupid-purple"></div>
             <p className="text-[10px] uppercase tracking-[0.6em] text-white/30 font-black whitespace-nowrap">ELAPSED TIME</p>
             <div className="h-[2px] w-8 bg-stupid-purple"></div>
          </div>
        </div>

        {/* PRIMARY METRICS */}
        <div className="grid grid-cols-1 gap-6 w-full mb-10">
          <div className="bg-stupid-card p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">distance</span>
            </div>
            <p className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em] mb-2">TOTAL DISTANCE</p>
            <div className="flex items-baseline gap-2 justify-center">
              <p className="text-7xl font-display font-black italic text-stupid-neon tabular-nums">{distance.toFixed(2)}</p>
              <p className="text-lg font-black italic text-white/30">KM</p>
            </div>
          </div>
        </div>

        {/* MAP AREA */}
        <div className="w-full h-36 sm:h-48 bg-stupid-card rounded-[40px] mb-6 overflow-hidden relative border-2 border-white/5 group shadow-inner">
          <img src="https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-40 grayscale contrast-150 brightness-50" alt="Map" />
          <div className="absolute inset-0 bg-gradient-to-t from-stupid-black/80 to-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`size-6 bg-stupid-purple/30 rounded-full ${isActive ? 'animate-ping' : ''}`}></div>
            <div className="size-3 bg-stupid-purple rounded-full absolute shadow-[0_0_20px_rgba(168,0,255,1)] border-2 border-white"></div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-1.5 rounded-full border border-white/10">
             <span className="material-symbols-outlined text-stupid-neon text-sm">explore</span>
             <p className="text-[9px] font-black text-white uppercase tracking-widest">VAAL TERRITORY ACTIVE</p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-5 w-full mt-auto mb-6">
          {!isActive ? (
            <button 
              onClick={handleToggle}
              className="flex-1 bg-stupid-purple text-white font-black italic text-2xl py-8 rounded-[32px] active:scale-95 transition-all shadow-[0_20px_60px_rgba(168,0,255,0.5)] border-t border-white/20 uppercase tracking-tighter"
            >
              START {activityType}
            </button>
          ) : (
            <>
              <button 
                onClick={handleToggle}
                className="flex-1 bg-white/5 text-white/40 font-black italic text-xl py-8 rounded-[32px] active:scale-95 transition-all border border-white/10 uppercase tracking-tighter"
              >
                PAUSE
              </button>
              <button 
                onClick={() => { triggerHaptic([30, 30, 100]); onClose(); }}
                className="flex-1 bg-stupid-neon text-black font-black italic text-xl py-8 rounded-[32px] active:scale-95 transition-all uppercase tracking-tighter shadow-[0_15px_40px_rgba(204,255,0,0.4)]"
              >
                FINISH
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordOverlay;
