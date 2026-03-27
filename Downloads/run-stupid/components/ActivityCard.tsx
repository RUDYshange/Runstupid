
import React, { useState } from 'react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onKudos: (id: string) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onKudos }) => {
  const [isLiked, setIsLiked] = useState(activity.hasLiked);
  const [likes, setLikes] = useState(activity.kudosCount);

  const handleKudos = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    onKudos(activity.id);
  };

  const isSquad = (activity.participants?.length || 0) > 0;

  return (
    <div className={`bg-stupid-card rounded-[32px] border ${activity.isUpcoming ? 'border-stupid-purple/50' : 'border-white/5'} overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-4">
            <div className="size-12 rounded-2xl border-2 border-stupid-card overflow-hidden bg-stupid-gray z-30 shadow-xl rotate-[-4deg]">
              <img src={activity.user.avatar} className="w-full h-full object-cover grayscale" />
            </div>
            {activity.participants?.slice(0, 2).map((p, i) => (
              <div key={p.id} className="size-12 rounded-2xl border-2 border-stupid-card overflow-hidden bg-stupid-gray shadow-lg" style={{ zIndex: 20 - i }}>
                <img src={p.avatar} className="w-full h-full object-cover grayscale opacity-50" />
              </div>
            ))}
          </div>
          <div className="min-w-0">
            <p className="font-display font-black italic text-sm sm:text-base uppercase tracking-tight text-white/95 truncate">
              {isSquad ? `${activity.user.name.split(' ')[0]} + CREW` : activity.user.name}
            </p>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest truncate">{activity.timestamp} • {activity.type}</p>
          </div>
        </div>
        {activity.isUpcoming && (
           <div className="bg-stupid-neon text-black px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-stupid-neon/10">SQUAD UP</div>
        )}
      </div>

      {/* Segment Badge - Neon Accent */}
      {activity.segmentName && (
        <div className="px-5 py-2 flex items-center gap-3 bg-stupid-purple/10 border-y border-white/5">
          <span className="material-symbols-outlined text-stupid-neon text-[20px] font-black animate-pulse-soft">stars</span>
          <p className="text-[10px] font-black italic uppercase text-white tracking-[0.15em]">VAAL LEGEND: <span className="text-stupid-neon">{activity.segmentName}</span></p>
        </div>
      )}

      {/* Map Content - Grayscale with Purple Hue */}
      {activity.mapImageUrl && (
        <div className="relative aspect-video w-full group overflow-hidden border-b border-white/5">
          <img 
            src={activity.mapImageUrl} 
            className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-80 transition-all duration-1000 scale-105 group-hover:scale-100" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stupid-black/90 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6">
             <div className="bg-stupid-purple px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/20">
                <span className="material-symbols-outlined text-[16px] text-stupid-neon font-black">gps_fixed</span>
                <p className="text-[10px] font-black text-white italic uppercase tracking-widest">PACK TERRITORY</p>
             </div>
          </div>
        </div>
      )}

      {/* Metrics Grid - High Contrast */}
      <div className="px-4 sm:px-6 py-5 grid grid-cols-3 gap-2 sm:gap-4 border-b border-white/5 bg-white/[0.02]">
        {activity.metrics.map((m) => (
          <div key={m.label} className="flex flex-col min-w-0">
            <p className="text-[9px] uppercase font-black text-white/20 tracking-widest leading-none mb-2 truncate">{m.label}</p>
            <p className="font-display font-black italic text-base sm:text-xl leading-tight text-white truncate">
              {m.value} <span className="text-[10px] font-normal opacity-30 non-italic">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3 bg-stupid-black/20">
        {activity.isUpcoming ? (
          <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[22px] bg-stupid-purple text-white shadow-2xl shadow-stupid-purple/30 active:scale-[0.98] transition-all font-black text-sm italic tracking-tighter border-t border-white/20">
            <span className="material-symbols-outlined font-black">person_add</span>
            JOIN THE PACK
          </button>
        ) : (
          <>
            <button 
              onClick={handleKudos}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] transition-all active:scale-[0.96] border border-white/5 ${
                isLiked ? 'bg-stupid-purple text-white shadow-xl shadow-stupid-purple/30' : 'bg-white/5 text-white/40'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isLiked ? 'fill-1 text-stupid-neon' : ''}`}>favorite</span>
              <span className="text-[11px] font-black uppercase italic tracking-tighter">RESPECT</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 py-4 rounded-[22px] bg-white/5 text-white/40 active:bg-white/10 transition-all active:scale-[0.96] border border-white/5">
              <span className="material-symbols-outlined text-[24px]">forum</span>
              <span className="text-[11px] font-black uppercase italic tracking-tighter">CHATS</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
