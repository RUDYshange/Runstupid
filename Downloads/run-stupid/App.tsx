
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, TabType, Challenge, Club } from './types';
import ActivityCard from './components/ActivityCard';
import RecordOverlay from './components/RecordOverlay';
import AuthScreen from './components/AuthScreen';
import { getCoachInsights, discoverStupidRoutes } from './services/geminiService';
import { activities as activityDb, clubs as clubDb, challenges as challengeDb, kudos as kudosDb, auth, profile as profileDb, realtime } from './services/dbService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [userProfile, setUserProfile] = useState<{ display_name: string; avatar_url: string | null; rank: string; bio: string | null } | null>(null);
  
  // Updated type to handle text and grounding links
  const [aiInsight, setAiInsight] = useState<{ text: string, links: string[] } | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [routes, setRoutes] = useState<{text: string, links: string[]} | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [biTimeRange, setBiTimeRange] = useState<'7D' | '30D' | 'ALL'>('7D');

  // ── Load all real data for a signed-in user ──────────────────────────────
  const loadData = useCallback(async (userId: string) => {
    setIsLoadingFeed(true);
    const [feedRes, clubsRes, challengesRes, profileRes] = await Promise.all([
      activityDb.getFeed(userId),
      clubDb.getAll(),
      challengeDb.getActive(),
      profileDb.get(userId),
    ]);
    if (!feedRes.error)       setActivities(feedRes.data ?? []);
    if (!clubsRes.error)      setClubs(clubsRes.data ?? []);
    if (!challengesRes.error) setChallenges(challengesRes.data ?? []);
    if (!profileRes.error && profileRes.data) setUserProfile(profileRes.data);
    setIsLoadingFeed(false);
  }, []);

  // ── Bootstrap: check auth, then load data ────────────────────────────────
  useEffect(() => {
    auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      setCurrentUserId(uid);
      if (uid) loadData(uid);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = auth.onAuthChange((_event, session) => {
      const uid = session?.user?.id;
      setCurrentUserId(uid);
      if (uid) {
        loadData(uid);
      } else {
        // Signed out — clear everything
        setActivities([]);
        setClubs([]);
        setChallenges([]);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadData]);

  // ── Real-time: new activities pushed to top of feed ───────────────────────
  useEffect(() => {
    return realtime.onNewActivity(currentUserId, (newActivity) => {
      setActivities(prev => [newActivity, ...prev]);
    });
  }, [currentUserId]);

  // ── AI insights (re-runs when activities change) ──────────────────────────
  useEffect(() => {
    const fetchInsight = async () => {
      setIsLoadingInsight(true);
      const insightData = await getCoachInsights(activities);
      setAiInsight(insightData);
      setIsLoadingInsight(false);
    };
    fetchInsight();
  }, [activities]);

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleTabChange = (tab: TabType) => {
    triggerHaptic(5);
    setActiveTab(tab);
  };

  const handleKudos = useCallback(async (id: string) => {
    triggerHaptic([10, 20, 10]);
    // Optimistic update
    setActivities(prev => prev.map(a =>
      a.id === id ? { ...a, hasLiked: !a.hasLiked, kudosCount: a.hasLiked ? a.kudosCount - 1 : a.kudosCount + 1 } : a
    ));
    // Persist to DB (if fails, the UI stays optimistic — acceptable for MVP)
    await kudosDb.toggle(id);
  }, []);

  const handleDiscoverRoutes = async () => {
    triggerHaptic(20);
    setIsLoadingRoutes(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const data = await discoverStupidRoutes(pos.coords.latitude, pos.coords.longitude);
        setRoutes(data);
        setIsLoadingRoutes(false);
      },
      async () => {
        const data = await discoverStupidRoutes();
        setRoutes(data);
        setIsLoadingRoutes(false);
      }
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="flex flex-col gap-4 p-3 sm:p-4 pb-28">
            <div className="bg-stupid-purple border-b-4 border-stupid-neon rounded-3xl p-6 relative overflow-hidden shadow-2xl shadow-stupid-purple/20">
              <div className="absolute -right-10 -top-10 size-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="flex gap-3 items-center mb-3">
                <span className="material-symbols-outlined text-stupid-neon font-black text-2xl">bolt</span>
                <h3 className="font-display font-black italic text-white uppercase tracking-tighter text-xl">PACK INTEL</h3>
              </div>
              <p className="text-sm leading-relaxed text-white font-medium italic relative z-10">
                "{isLoadingInsight ? "Synchronizing suffering..." : aiInsight?.text}"
              </p>
              {/* Added Search Grounding Links for compliance */}
              {!isLoadingInsight && aiInsight && aiInsight.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 relative z-10">
                  {aiInsight.links.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-lg text-[8px] font-black text-stupid-neon uppercase tracking-widest border border-white/10 transition-colors">
                      SOURCE {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center px-1">
               <h4 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">SHARED GRIND</h4>
               <div className="size-2 bg-stupid-neon rounded-full animate-pulse"></div>
            </div>

            {isLoadingFeed ? (
              // Loading skeleton
              [1, 2].map(i => (
                <div key={i} className="bg-stupid-card rounded-[32px] border border-white/5 overflow-hidden shadow-2xl animate-pulse">
                  <div className="p-4 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/10" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 bg-white/10 rounded-full w-32" />
                      <div className="h-2 bg-white/5 rounded-full w-20" />
                    </div>
                  </div>
                  <div className="aspect-video w-full bg-white/5" />
                  <div className="px-4 py-5 grid grid-cols-3 gap-4">
                    {[1,2,3].map(j => <div key={j} className="h-8 bg-white/5 rounded-xl" />)}
                  </div>
                </div>
              ))
            ) : activities.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-20 rounded-3xl bg-stupid-purple/10 border border-stupid-purple/20 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-stupid-purple text-4xl">directions_run</span>
                </div>
                <p className="font-display font-black italic text-2xl uppercase tracking-tighter text-white mb-2">NO GRIND YET</p>
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest mb-8">Be the first to log a stupid activity</p>
                <button
                  onClick={() => { triggerHaptic([20, 40, 20]); setIsRecording(true); }}
                  className="bg-stupid-purple text-white font-black italic text-sm py-4 px-8 rounded-[20px] uppercase tracking-tighter shadow-[0_10px_30px_rgba(168,0,255,0.4)] border-t border-white/20 active:scale-95 transition-all"
                >
                  LOG FIRST ACTIVITY
                </button>
              </div>
            ) : (
              activities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onKudos={handleKudos}
                />
              ))
            )}
          </div>
        );
      case 'clubs':
        return (
          <div className="flex flex-col gap-6 p-3 sm:p-4 pb-28">
             <div className="pt-4">
                <div className="flex flex-wrap gap-3 justify-between items-start mb-6">
                  <div>
                    <h2 className="font-display font-black italic text-4xl uppercase tracking-tighter mb-1 text-white">VAAL</h2>
                    <p className="text-stupid-neon text-[10px] uppercase font-bold tracking-[0.2em]">RIVER SIDE HUB</p>
                  </div>
                  <button 
                    onClick={handleDiscoverRoutes}
                    disabled={isLoadingRoutes}
                    className="bg-stupid-purple text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl active:scale-95 transition-all disabled:opacity-50 border border-white/10"
                  >
                    {isLoadingRoutes ? 'Searching...' : 'EXPLORE VAAL ROUTES'}
                  </button>
                </div>
                
                {routes && (
                  <div className="mb-8 bg-stupid-gray p-6 rounded-3xl border border-stupid-purple/30 shadow-2xl animate-in slide-in-from-top-4">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-stupid-neon">water_drop</span>
                        <p className="text-[11px] font-black uppercase text-stupid-neon tracking-widest">LOCAL VAAL DISCOVERY</p>
                     </div>
                     <p className="text-sm text-white/90 leading-relaxed mb-6 italic border-l-2 border-stupid-neon pl-4">"{routes.text}"</p>
                     <div className="grid grid-cols-1 gap-2">
                        {routes.links.map((link, i) => (
                          <a key={i} href={link} target="_blank" className="flex items-center justify-between bg-white/5 px-4 py-4 rounded-xl border border-white/5 font-bold uppercase text-[10px] hover:bg-white/10 group">
                            OPEN IN MAPS
                            <span className="material-symbols-outlined text-stupid-purple group-hover:translate-x-1 transition-transform">arrow_forward</span>
                          </a>
                        ))}
                     </div>
                  </div>
                )}
                
                <h3 className="text-[10px] font-black uppercase text-white/20 tracking-widest mb-4">ACTIVE PACKS</h3>
                <div className="flex flex-col gap-4">
                   {clubs.map(club => (
                     <div key={club.id} className="flex items-center gap-4 bg-stupid-card p-4 rounded-2xl border border-white/5 shadow-lg group active:bg-stupid-gray transition-colors">
                        <img src={club.imageUrl} className="size-16 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                        <div className="flex-1">
                           <h3 className="font-display font-black italic text-lg uppercase tracking-tight text-white/90">{club.name}</h3>
                           <p className="text-xs text-white/40 uppercase font-bold tracking-tighter">{club.memberCount} Athletes</p>
                        </div>
                        <button className="bg-stupid-purple/10 text-stupid-purple px-4 py-2 rounded-lg text-[10px] font-black uppercase border border-stupid-purple/20">VIEW</button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        );
      case 'training':
        return (
          <div className="flex flex-col gap-4 p-3 sm:p-4 pb-28 overflow-hidden">
            <div className="pt-4 flex justify-between items-end">
              <div>
                <h2 className="font-display font-black italic text-4xl uppercase tracking-tighter leading-none text-white">STUPID BI</h2>
                <p className="text-stupid-neon text-[10px] uppercase font-bold tracking-[0.2em] mt-2">ANALYTICS ENGINE</p>
              </div>
              <div className="flex bg-stupid-gray p-1.5 rounded-xl border border-white/10">
                {['7D', '30D', 'ALL'].map(range => (
                  <button 
                    key={range}
                    onClick={() => { triggerHaptic(5); setBiTimeRange(range as any); }}
                    className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${biTimeRange === range ? 'bg-stupid-purple text-white shadow-lg' : 'text-white/30'}`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stupid-card p-5 rounded-3xl border border-white/5 relative overflow-hidden shadow-xl">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">TOTAL DIST</p>
                <p className="text-4xl font-display font-black italic text-stupid-neon tabular-nums mt-2">142.2 <span className="text-xs font-normal opacity-30 non-italic">KM</span></p>
                <div className="h-1 w-12 bg-stupid-neon/20 rounded-full mt-4"></div>
              </div>
              <div className="bg-stupid-card p-5 rounded-3xl border border-white/5 shadow-xl">
                <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">ELEVATION</p>
                <p className="text-4xl font-display font-black italic text-white tabular-nums mt-2">2.4K <span className="text-xs font-normal opacity-30 non-italic">M</span></p>
                <div className="h-1 w-12 bg-white/10 rounded-full mt-4"></div>
              </div>
            </div>

            <div className="bg-stupid-card p-6 rounded-3xl border border-white/5 shadow-2xl">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-2">
                   <span className="material-symbols-outlined text-stupid-purple">bar_chart</span>
                   VOLUME ANALYSIS
                 </h3>
                 <span className="text-[9px] font-black text-stupid-neon uppercase">+14% vs PREV</span>
               </div>
               <div className="flex items-end justify-between h-40 gap-3 px-2">
                 {[40, 75, 20, 95, 10, 60, 85].map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center group">
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-700 relative ${i === 3 ? 'bg-stupid-purple shadow-[0_0_20px_rgba(168,0,255,0.4)]' : 'bg-white/10 group-hover:bg-white/20'}`} 
                        style={{ height: `${h}%` }}
                      ></div>
                      <span className="text-[10px] font-bold text-white/20 mt-3 uppercase tracking-tighter">{'MTWTFSS'[i]}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-stupid-purple/5 border-l-4 border-stupid-neon rounded-r-3xl p-6 relative overflow-hidden bg-stupid-card">
               <h3 className="text-[11px] font-black uppercase text-stupid-neon tracking-[0.2em] mb-3">AI NARRATIVE</h3>
               <p className="text-sm text-white/80 leading-relaxed italic">
                 "Performance analysis indicates a high-intensity volume cluster on Thursday. Relative effort is exceeding baseline by 14.2%. Recommend maintaining stupid levels of hydration for the upcoming weekend peak."
               </p>
            </div>
          </div>
        );
      case 'profile':
        const myActivitiesCount = activities.filter(a => a.user.id === currentUserId).length;
        const myKudosReceived   = activities.filter(a => a.user.id === currentUserId).reduce((s, a) => s + a.kudosCount, 0);
        const avatarUrl = userProfile?.avatar_url
          ?? `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userProfile?.display_name ?? 'RS')}&backgroundColor=A800FF&textColor=ffffff`;
        return (
          <div className="p-4 sm:p-6 pt-6 flex flex-col items-center pb-28">
            <div className="relative mb-8">
              <div className="size-28 sm:size-36 rounded-full border-[6px] border-stupid-purple p-1 shadow-2xl shadow-stupid-purple/40 overflow-hidden bg-stupid-card">
                <img src={avatarUrl} className="rounded-full w-full h-full object-cover grayscale" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-stupid-neon text-black font-black text-[10px] px-4 py-1.5 rounded-full uppercase shadow-xl border-2 border-stupid-black">
                {userProfile?.rank ?? 'ROOKIE'}
              </div>
            </div>

            <h2 className="font-display font-black italic text-4xl uppercase tracking-tighter text-white leading-none mb-3 text-center">
              {userProfile?.display_name ?? '...'}
            </h2>
            {userProfile?.bio && (
              <p className="text-white/50 text-xs text-center mb-4 max-w-xs">{userProfile.bio}</p>
            )}
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mb-10 flex items-center gap-2">
              <span className="size-1.5 bg-stupid-neon rounded-full"></span> ACTIVE MEMBER
            </p>

            <div className="w-full grid grid-cols-3 gap-4 mb-10">
              <div className="flex flex-col items-center p-5 bg-stupid-card rounded-3xl border border-white/5 shadow-lg">
                <p className="font-display font-black text-3xl italic text-stupid-purple leading-none">{myActivitiesCount}</p>
                <p className="text-[9px] uppercase font-bold text-white/20 tracking-widest mt-3">ACTIVITIES</p>
              </div>
              <div className="flex flex-col items-center p-5 bg-stupid-card rounded-3xl border border-white/5 shadow-lg">
                <p className="font-display font-black text-3xl italic text-white leading-none">{clubs.length}</p>
                <p className="text-[9px] uppercase font-bold text-white/20 tracking-widest mt-3">CLUBS</p>
              </div>
              <div className="flex flex-col items-center p-5 bg-stupid-card rounded-3xl border border-white/5 shadow-lg">
                <p className="font-display font-black text-3xl italic text-stupid-neon leading-none">{myKudosReceived}</p>
                <p className="text-[9px] uppercase font-bold text-white/20 tracking-widest mt-3">KUDOS</p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              <button onClick={() => triggerHaptic(10)} className="w-full bg-stupid-purple text-white py-5 rounded-2xl font-black uppercase text-xs italic tracking-tighter shadow-2xl shadow-stupid-purple/20 active:scale-[0.98] transition-all border border-white/10">
                EDIT PROFILE
              </button>
              <button
                onClick={async () => { triggerHaptic([10, 30, 10]); await auth.signOut(); }}
                className="w-full bg-white/5 text-red-400 py-5 rounded-2xl font-black uppercase text-xs italic tracking-tighter border border-red-500/20 active:scale-[0.98] transition-all"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (isAuthChecking) {
    return (
      <div className="fixed inset-0 bg-stupid-black flex flex-col items-center justify-center gap-4">
        <div className="bg-stupid-purple px-4 py-2 rounded-xl shadow-2xl shadow-stupid-purple/40 transform -skew-x-12 flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-white text-xl scale-x-[-1]">directions_run</span>
          <span className="font-display font-black italic text-white text-2xl uppercase tracking-tighter leading-none">RUN STUPID</span>
        </div>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.5em]">Loading...</p>
      </div>
    );
  }

  if (!currentUserId) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-stupid-black max-w-md mx-auto overflow-hidden ring-1 ring-white/5 h-full">
      <header className="sticky top-0 z-[60] flex items-center justify-between px-6 py-6 glass border-b border-white/5 shadow-2xl pt-safe">
        <div className="flex items-center gap-3">
           <div className="relative flex items-center justify-center">
              <div className="size-2 bg-stupid-neon rounded-full animate-ping absolute opacity-50"></div>
              <div className="size-2 bg-stupid-neon rounded-full shadow-[0_0_12px_#CCFF00]"></div>
           </div>
           {/* BRAND LOGO AREA */}
           <div className="flex flex-col">
              <div className="bg-stupid-purple px-3 py-1 rounded shadow-lg transform -skew-x-12 flex items-center gap-2">
                 <span className="material-symbols-outlined text-white text-sm font-black italic scale-x-[-1]">directions_run</span>
                 <span className="font-display font-black italic text-white text-lg uppercase tracking-tighter leading-none mt-0.5">RUN STUPID</span>
              </div>
              <span className="text-[8px] font-black text-white/30 tracking-[0.5em] mt-1 ml-4 uppercase">SOCIAL CLUB ESTD 2025</span>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => triggerHaptic(5)} className="size-11 rounded-2xl flex items-center justify-center bg-white/5 text-white/60 border border-white/10 active:bg-stupid-purple active:text-white transition-all">
             <span className="material-symbols-outlined text-[24px]">search</span>
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-stupid-black relative h-full">
        {renderContent()}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-[80] max-w-md mx-auto glass border-t border-white/10 flex items-center justify-around px-2 pt-3 nav-safe-bottom">
        {[
          { id: 'feed', icon: 'home', label: 'Feed' },
          { id: 'clubs', icon: 'explore', label: 'Vaal' },
          { id: 'add', icon: 'add', label: '' },
          { id: 'training', icon: 'analytics', label: 'BI' },
          { id: 'profile', icon: 'person', label: 'You' }
        ].map((tab) => (
          tab.id === 'add' ? (
            <button
              key="add"
              onClick={() => { triggerHaptic([20, 40, 20]); setIsRecording(true); }}
              className="relative flex flex-col items-center justify-center size-16 rounded-3xl bg-stupid-purple text-white shadow-[0_8px_30px_rgba(168,0,255,0.6)] active:scale-90 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-stupid-neon/20 rounded-3xl blur-xl group-active:blur-2xl transition-all"></div>
              <span className="material-symbols-outlined text-[32px] font-black group-hover:scale-110 transition-transform relative z-10">add</span>
            </button>
          ) : (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as TabType)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 group ${
              activeTab === tab.id ? 'text-stupid-purple' : 'text-white/20'
            }`}
          >
            <span className={`material-symbols-outlined text-[32px] ${activeTab === tab.id ? 'fill-1 scale-110' : 'group-active:text-white/60'}`}>
              {tab.icon}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>{tab.label}</span>
          </button>
          )
        ))}
      </nav>

      {isRecording && <RecordOverlay onClose={() => setIsRecording(false)} />}
    </div>
  );
};

export default App;
