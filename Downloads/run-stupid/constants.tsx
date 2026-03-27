
import { Activity, ActivityType, Challenge, Club } from './types';

const USERS = {
  alex: { id: 'u1', name: 'Alex H.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100' },
  sarah: { id: 'u2', name: 'Sarah J.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100' },
  david: { id: 'u3', name: 'David C.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100' },
  mike: { id: 'u4', name: 'Mike T.', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100' }
};

export const INITIAL_FEED: Activity[] = [
  {
    id: '1',
    user: USERS.alex,
    participants: [USERS.sarah, USERS.mike],
    type: ActivityType.SQUAD,
    timestamp: 'Just now',
    mapImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2nBVcfIjGZLgaTqNfNW7jE2V7Q89XVITxiNu0YW_awnt1IgypOLaTjUFhCRzvgx__xaNTHtpLryTfMT4YMugdDFmMGzVj214v8eS8YKVlDdyl9enog-8-_Urw0KW7lqXeZ2mwBnDAGQyT0ZPWC1wcrbEUMSdNhsq0d5cBRJYh1W0VJcFNYWEAVSQvcpmEmDCeNuPdY0u6epPdiAKiyXiqBCx8PdZJH-Miv2p6dKJGhDK818fbVPs5-IlX0FHGv2z3q1yCl80N86Ne',
    metrics: [
      { label: 'Distance', value: '15.2', unit: 'km' },
      { label: 'Pace', value: '4:45', unit: '/km' },
      { label: 'Relative Effort', value: 'Stupidly High' }
    ],
    kudosCount: 124,
    commentCount: 8,
    hasLiked: true,
    segmentName: 'The Hill of Regret'
  },
  {
    id: '2',
    user: USERS.sarah,
    type: ActivityType.RIDE,
    timestamp: '2h ago',
    mapImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfPCehtcD2vWyM9tXZGk8dNdB_Ntchp3q1csJg7lnFzIu2Tj6NulFro6LXPqAt1D4vdFBlFG4VieCVqZMNCedrEHhyOQ0XgL5FDXniYL7FXvcgZFcSvQLLs3p0Ya_Quftmvo4ZQqIvPLOQppzKd1Z1EOXVnqS1Ixmy4v5PobVn-BZHKwHD4ieCe3MDLxlxeAJ9ER8S4Mf_ig2cTvuW1qOYVZEChyQwxeeJ7V9skArc2QbmV9CwpITR0ayJp35NFAxAbDBpSSN8yTUB',
    metrics: [
      { label: 'Distance', value: '42.0', unit: 'km' },
      { label: 'Speed', value: '28.5', unit: 'km/h' },
      { label: 'Power', value: '240', unit: 'W' }
    ],
    kudosCount: 56,
    commentCount: 2,
    hasLiked: false
  }
];

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'March 10k Every Day',
    description: 'Keep the momentum. 10km every single day in March.',
    progress: 65,
    participantsCount: 1240,
    imageUrl: 'https://images.unsplash.com/photo-1530143311094-34d8023d8e58?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c2',
    title: 'Vertical Stupid Summit',
    description: 'Climb 5,000m total elevation this month.',
    progress: 20,
    participantsCount: 850,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400'
  }
];

export const MOCK_CLUBS: Club[] = [
  { id: 'cl1', name: 'Dawn Patrol Idiots', memberCount: 120, imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=200' },
  { id: 'cl2', name: 'Pain Cave Cycling', memberCount: 85, imageUrl: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=200' },
  { id: 'cl3', name: 'Run Stupid Global', memberCount: 5400, imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=200' }
];

export const UPCOMING_RUNS: Activity[] = [
  {
    id: 'e1',
    user: USERS.mike,
    participants: [USERS.alex, USERS.sarah, USERS.david],
    type: ActivityType.SQUAD,
    timestamp: 'Sat 8:00 AM',
    metrics: [
      { label: 'Route', value: 'City Loop' },
      { label: 'Going', value: '14 Athletes' }
    ],
    kudosCount: 0,
    commentCount: 0,
    hasLiked: false,
    isUpcoming: true
  }
];
