
export enum ActivityType {
  RUN = 'Run',
  RIDE = 'Ride',
  WALK = 'Walk',
  SWIM = 'Swim',
  HIKE = 'Hike',
  YOGA = 'Yoga',
  SQUAD = 'Squad Session'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Metric {
  label: string;
  value: string;
  unit?: string;
}

export interface Activity {
  id: string;
  user: User;
  participants?: User[];
  type: ActivityType;
  timestamp: string;
  mapImageUrl?: string;
  metrics: Metric[];
  kudosCount: number;
  commentCount: number;
  hasLiked: boolean;
  isUpcoming?: boolean;
  segmentName?: string; // Strava-like segments
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number; // 0 to 100
  participantsCount: number;
  imageUrl: string;
}

export interface Club {
  id: string;
  name: string;
  memberCount: number;
  imageUrl: string;
}

export type TabType = 'feed' | 'clubs' | 'record' | 'training' | 'profile';
