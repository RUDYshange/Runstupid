/**
 * dbService.ts — Run Stupid database service layer
 *
 * All Supabase CRUD operations are centralised here.
 * Components import from this file — never directly from supabaseClient.
 *
 * Pattern:  every function returns { data, error }  so callers can handle
 * both success and failure consistently.
 */

import { supabase } from './supabaseClient';
import type { Activity, ActivityType, Club, Challenge } from '../types';

// ─── Type helpers ────────────────────────────────────────────────────────────

/** Raw row shapes returned by Supabase (snake_case) */
interface DbActivity {
  id: string;
  user_id: string;
  type: string;
  started_at: string;
  distance_km: number | null;
  duration_seconds: number | null;
  avg_pace_sec_km: number | null;
  elevation_m: number | null;
  avg_power_w: number | null;
  avg_speed_km_h: number | null;
  map_image_url: string | null;
  segment_name: string | null;
  is_upcoming: boolean;
  kudos_count: number;
  comment_count: number;
  profiles: { id: string; display_name: string; avatar_url: string | null };
  activity_participants: Array<{
    profiles: { id: string; display_name: string; avatar_url: string | null };
  }>;
  kudos: Array<{ user_id: string }>;
}

interface DbClub {
  id: string;
  name: string;
  image_url: string | null;
  member_count: number;
}

interface DbChallenge {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_value: number | null;
  challenge_participants: Array<{ progress: number }>;
}

// ─── Mappers (DB row → app type) ─────────────────────────────────────────────

function mapActivity(row: DbActivity, currentUserId?: string): Activity {
  const metrics: Activity['metrics'] = [];

  if (row.distance_km != null) {
    metrics.push({ label: 'Distance', value: row.distance_km.toFixed(1), unit: 'km' });
  }
  if (row.avg_pace_sec_km != null) {
    const mins = Math.floor(row.avg_pace_sec_km / 60);
    const secs = (row.avg_pace_sec_km % 60).toString().padStart(2, '0');
    metrics.push({ label: 'Pace', value: `${mins}:${secs}`, unit: '/km' });
  }
  if (row.avg_speed_km_h != null) {
    metrics.push({ label: 'Speed', value: row.avg_speed_km_h.toFixed(1), unit: 'km/h' });
  }
  if (row.avg_power_w != null) {
    metrics.push({ label: 'Power', value: String(row.avg_power_w), unit: 'W' });
  }
  if (row.elevation_m != null) {
    metrics.push({ label: 'Elevation', value: row.elevation_m.toFixed(0), unit: 'm' });
  }

  const hasLiked = currentUserId
    ? row.kudos.some(k => k.user_id === currentUserId)
    : false;

  return {
    id: row.id,
    user: {
      id: row.profiles.id,
      name: row.profiles.display_name,
      avatar: row.profiles.avatar_url ?? `https://api.dicebear.com/8.x/initials/svg?seed=${row.profiles.display_name}`,
    },
    participants: row.activity_participants.map(p => ({
      id: p.profiles.id,
      name: p.profiles.display_name,
      avatar: p.profiles.avatar_url ?? `https://api.dicebear.com/8.x/initials/svg?seed=${p.profiles.display_name}`,
    })),
    type: row.type as ActivityType,
    timestamp: formatTimestamp(row.started_at),
    mapImageUrl: row.map_image_url ?? undefined,
    metrics: metrics.length > 0 ? metrics : [{ label: 'Type', value: row.type }],
    kudosCount: row.kudos_count,
    commentCount: row.comment_count,
    hasLiked,
    isUpcoming: row.is_upcoming,
    segmentName: row.segment_name ?? undefined,
  };
}

function formatTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const auth = {
  /** Sign up with email + password. Triggers handle_new_user() → creates profile row. */
  signUp: (email: string, password: string, displayName: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, username: email.split('@')[0] } },
    }),

  /** Sign in with email + password */
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  /** Sign out current user */
  signOut: () => supabase.auth.signOut(),

  /** Get the currently authenticated user */
  getUser: () => supabase.auth.getUser(),

  /** Listen for auth state changes */
  onAuthChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

export const activities = {
  /**
   * Fetch the social feed — all public activities, newest first.
   * Pass `currentUserId` to populate `hasLiked` on each card.
   */
  getFeed: async (currentUserId?: string, limit = 20) => {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles ( id, display_name, avatar_url ),
        activity_participants (
          profiles ( id, display_name, avatar_url )
        ),
        kudos ( user_id )
      `)
      .eq('is_upcoming', false)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) return { data: null, error };
    return { data: (data as unknown as DbActivity[]).map(r => mapActivity(r, currentUserId)), error: null };
  },

  /**
   * Fetch upcoming squad events.
   */
  getUpcoming: async (currentUserId?: string) => {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        profiles ( id, display_name, avatar_url ),
        activity_participants ( profiles ( id, display_name, avatar_url ) ),
        kudos ( user_id )
      `)
      .eq('is_upcoming', true)
      .gte('started_at', new Date().toISOString())
      .order('started_at', { ascending: true })
      .limit(10);

    if (error) return { data: null, error };
    return { data: (data as unknown as DbActivity[]).map(r => mapActivity(r, currentUserId)), error: null };
  },

  /**
   * Record a new activity after a run/ride/etc finishes.
   */
  create: async (payload: {
    type: ActivityType;
    distanceKm?: number;
    durationSeconds?: number;
    avgPaceSecKm?: number;
    elevationM?: number;
    avgPowerW?: number;
    avgSpeedKmH?: number;
    mapImageUrl?: string;
    segmentName?: string;
    isUpcoming?: boolean;
    startedAt?: string;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { data: null, error: new Error('Not authenticated') };

    return supabase
      .from('activities')
      .insert({
        user_id:          userData.user.id,
        type:             payload.type,
        distance_km:      payload.distanceKm ?? null,
        duration_seconds: payload.durationSeconds ?? null,
        avg_pace_sec_km:  payload.avgPaceSecKm ?? null,
        elevation_m:      payload.elevationM ?? null,
        avg_power_w:      payload.avgPowerW ?? null,
        avg_speed_km_h:   payload.avgSpeedKmH ?? null,
        map_image_url:    payload.mapImageUrl ?? null,
        segment_name:     payload.segmentName ?? null,
        is_upcoming:      payload.isUpcoming ?? false,
        started_at:       payload.startedAt ?? new Date().toISOString(),
      })
      .select()
      .single();
  },

  /** Delete an activity (only the owner can do this — RLS enforces it). */
  delete: (activityId: string) =>
    supabase.from('activities').delete().eq('id', activityId),
};

// ─── KUDOS ────────────────────────────────────────────────────────────────────

export const kudos = {
  /**
   * Toggle kudos on an activity.
   * Returns the new hasLiked state.
   */
  toggle: async (activityId: string): Promise<{ hasLiked: boolean; error: Error | null }> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { hasLiked: false, error: new Error('Not authenticated') };

    const userId = userData.user.id;

    // Check current state
    const { data: existing } = await supabase
      .from('kudos')
      .select('user_id')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('kudos')
        .delete()
        .eq('activity_id', activityId)
        .eq('user_id', userId);
      return { hasLiked: false, error: error as Error | null };
    } else {
      // Like
      const { error } = await supabase
        .from('kudos')
        .insert({ activity_id: activityId, user_id: userId });
      return { hasLiked: true, error: error as Error | null };
    }
  },
};

// ─── CLUBS ────────────────────────────────────────────────────────────────────

export const clubs = {
  /** Fetch all clubs with member counts (uses the clubs_with_count view). */
  getAll: async (): Promise<{ data: Club[] | null; error: Error | null }> => {
    const { data, error } = await supabase
      .from('clubs_with_count')
      .select('*')
      .order('member_count', { ascending: false });

    if (error) return { data: null, error: error as Error };
    return {
      data: (data as DbClub[]).map(c => ({
        id: c.id,
        name: c.name,
        memberCount: c.member_count,
        imageUrl: c.image_url ?? 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=200',
      })),
      error: null,
    };
  },

  /** Join a club */
  join: async (clubId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: new Error('Not authenticated') };
    return supabase.from('club_members').insert({ club_id: clubId, user_id: userData.user.id });
  },

  /** Leave a club */
  leave: async (clubId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: new Error('Not authenticated') };
    return supabase.from('club_members').delete()
      .eq('club_id', clubId)
      .eq('user_id', userData.user.id);
  },
};

// ─── CHALLENGES ───────────────────────────────────────────────────────────────

export const challenges = {
  getActive: async (): Promise<{ data: Challenge[] | null; error: Error | null }> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_participants ( progress, user_id )
      `)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error: error as Error };

    return {
      data: (data as unknown as DbChallenge[]).map(c => ({
        id: c.id,
        title: c.title,
        description: c.description ?? '',
        imageUrl: c.image_url ?? 'https://images.unsplash.com/photo-1530143311094-34d8023d8e58?auto=format&fit=crop&q=80&w=400',
        progress: c.challenge_participants[0]?.progress ?? 0,
        participantsCount: c.challenge_participants.length,
      })),
      error: null,
    };
  },
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const profile = {
  /** Fetch a user's profile */
  get: (userId: string) =>
    supabase.from('profiles').select('*').eq('id', userId).single(),

  /** Update display name / bio / avatar */
  update: (userId: string, updates: { display_name?: string; bio?: string; avatar_url?: string; rank?: string }) =>
    supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId),

  /** Get follower & following counts */
  getCounts: async (userId: string) => {
    const [followers, following] = await Promise.all([
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return {
      followers: followers.count ?? 0,
      following: following.count ?? 0,
    };
  },
};

// ─── REAL-TIME SUBSCRIPTIONS ──────────────────────────────────────────────────

export const realtime = {
  /**
   * Subscribe to new activities in real-time.
   * Call the returned unsubscribe function in useEffect cleanup.
   *
   * @example
   * useEffect(() => {
   *   return realtime.onNewActivity(currentUserId, (activity) => {
   *     setActivities(prev => [activity, ...prev]);
   *   });
   * }, [currentUserId]);
   */
  onNewActivity: (currentUserId: string | undefined, cb: (activity: Activity) => void) => {
    const channel = supabase
      .channel('public:activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        async (payload) => {
          // Fetch full row with joins so we can map it properly
          const { data } = await supabase
            .from('activities')
            .select(`
              *,
              profiles ( id, display_name, avatar_url ),
              activity_participants ( profiles ( id, display_name, avatar_url ) ),
              kudos ( user_id )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) cb(mapActivity(data as unknown as DbActivity, currentUserId));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  /**
   * Subscribe to kudos changes on a specific activity.
   * Useful for live kudos count updates on the feed.
   */
  onKudosChange: (activityId: string, cb: (newCount: number) => void) => {
    const channel = supabase
      .channel(`kudos:${activityId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'activities', filter: `id=eq.${activityId}` },
        (payload) => {
          if (payload.new && 'kudos_count' in payload.new) {
            cb((payload.new as { kudos_count: number }).kudos_count);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
