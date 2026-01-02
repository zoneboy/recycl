import { BlogPost, MatchStatus, PaymentStatus, PaymentTransaction, Plan, Prediction, PredictionResult, SubscriptionTier, Tipster, User } from "../types";

// --- INITIAL DATA SEEDING (Formerly Mock Data) ---
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const getPastDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

export const INITIAL_TIPSTERS: Tipster[] = [
  {
    id: 't1',
    name: 'Ola',
    bio: 'With over 15 years of experience analyzing major European leagues, Ola combines statistical depth with an instinct for value.',
    winRate: 82,
    totalTips: 3450,
    imageUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    specialty: 'Global Football Analysis'
  }
];

export const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₦2,500/mo',
    features: ['Daily Free Tips', 'Access to Basic Tier Predictions', 'Basic Match Stats', 'Email Support'],
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₦5,000/mo',
    description: 'Best for active bettors who want solid daily slips without over-staking.',
    features: ['Everything in Basic', 'Access to Standard & Basic Predictions', 'Daily VIP Tips (3+)', 'Confidence level indicators', 'Tipster Performance Stats'],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₦10,000/mo',
    description: 'Aggressive but controlled staking strategy for serious investors.',
    features: ['Everything in Standard', 'Access to ALL Predictions', 'Direct Expert Access', 'AI-Powered Analysis', 'Access to in-play prediction', 'Money-back guarantee', '24/7 priority support'],
    recommended: false
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@heptabet.com',
    phoneNumber: '08012345678',
    subscription: SubscriptionTier.PREMIUM,
    role: 'admin',
    joinDate: '2023-01-15',
    subscriptionExpiryDate: '2025-12-31'
  },
  {
    id: 'u2',
    name: 'Basic User',
    email: 'basic@heptabet.com',
    phoneNumber: '08087654321',
    subscription: SubscriptionTier.BASIC,
    role: 'user',
    joinDate: getPastDate(45),
    subscriptionExpiryDate: getFutureDate(2)
  },
  {
    id: 'u3',
    name: 'Standard User',
    email: 'standard@heptabet.com',
    phoneNumber: '08011122233',
    subscription: SubscriptionTier.STANDARD,
    role: 'user',
    joinDate: getPastDate(10),
    subscriptionExpiryDate: getFutureDate(20)
  },
  {
    id: 'u4',
    name: 'Premium User',
    email: 'premium@heptabet.com',
    phoneNumber: '08099988877',
    subscription: SubscriptionTier.PREMIUM,
    role: 'user',
    joinDate: getPastDate(100),
    subscriptionExpiryDate: getFutureDate(5)
  }
];

const INITIAL_PREDICTIONS: Prediction[] = [
  {
    id: 'p1',
    league: 'Premier League',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    date: '2023-11-25',
    time: '18:30',
    tip: 'Arsenal Win',
    odds: 1.85,
    confidence: 9,
    minTier: SubscriptionTier.FREE,
    status: MatchStatus.SCHEDULED,
    result: PredictionResult.PENDING,
    tipsterId: 't1',
  },
  {
    id: 'p2',
    league: 'La Liga',
    homeTeam: 'Real Madrid',
    awayTeam: 'Valencia',
    date: '2023-11-25',
    time: '21:00',
    tip: 'Over 2.5 Goals',
    odds: 1.65,
    confidence: 8,
    minTier: SubscriptionTier.BASIC,
    status: MatchStatus.SCHEDULED,
    result: PredictionResult.PENDING,
    tipsterId: 't1',
  },
  {
    id: 'p3',
    league: 'NPFL',
    homeTeam: 'Enyimba',
    awayTeam: 'Kano Pillars',
    date: '2023-11-26',
    time: '16:00',
    tip: 'Enyimba Win & Under 3.5',
    odds: 2.10,
    confidence: 7,
    minTier: SubscriptionTier.STANDARD,
    status: MatchStatus.SCHEDULED,
    result: PredictionResult.PENDING,
    tipsterId: 't1',
  },
  {
    id: 'p4',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'Inter Milan',
    date: '2023-11-26',
    time: '20:45',
    tip: 'Both Teams to Score',
    odds: 1.90,
    confidence: 8,
    minTier: SubscriptionTier.FREE,
    status: MatchStatus.SCHEDULED,
    result: PredictionResult.PENDING,
    tipsterId: 't1',
  },
  {
    id: 'p5',
    league: 'Champions League',
    homeTeam: 'Man City',
    awayTeam: 'Leipzig',
    date: '2023-11-28',
    time: '21:00',
    tip: 'Man City -1.5 Handicap',
    odds: 1.95,
    confidence: 9,
    minTier: SubscriptionTier.PREMIUM,
    status: MatchStatus.SCHEDULED,
    result: PredictionResult.PENDING,
    tipsterId: 't1',
  },
  {
    id: 'h1',
    league: 'Premier League',
    homeTeam: 'Liverpool',
    awayTeam: 'Brentford',
    date: '2023-11-12',
    time: '15:00',
    tip: 'Liverpool Win & Over 2.5',
    odds: 1.80,
    confidence: 8,
    minTier: SubscriptionTier.STANDARD,
    status: MatchStatus.FINISHED,
    result: PredictionResult.WON,
    tipsterId: 't1',
  },
  {
    id: 'h2',
    league: 'Premier League',
    homeTeam: 'Chelsea',
    awayTeam: 'Man City',
    date: '2023-11-12',
    time: '17:30',
    tip: 'Man City Win',
    odds: 1.75,
    confidence: 7,
    minTier: SubscriptionTier.FREE,
    status: MatchStatus.FINISHED,
    result: PredictionResult.LOST,
    tipsterId: 't1',
  },
  {
    id: 'h3',
    league: 'La Liga',
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Villarreal',
    date: '2023-11-12',
    time: '21:00',
    tip: 'Atletico Win',
    odds: 1.50,
    confidence: 9,
    minTier: SubscriptionTier.BASIC,
    status: MatchStatus.FINISHED,
    result: PredictionResult.WON,
    tipsterId: 't1',
  },
  {
    id: 'h4',
    league: 'Serie A',
    homeTeam: 'Lazio',
    awayTeam: 'Roma',
    date: '2023-11-12',
    time: '18:00',
    tip: 'Draw',
    odds: 3.20,
    confidence: 5,
    minTier: SubscriptionTier.FREE,
    status: MatchStatus.FINISHED,
    result: PredictionResult.WON,
    tipsterId: 't1',
  }
];

const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'tx_123456',
    userId: 'u3',
    userName: 'Standard User',
    planId: 'Standard',
    amount: '₦5,000',
    method: 'Bank Transfer',
    status: PaymentStatus.APPROVED,
    date: '2023-11-20',
    receiptUrl: 'https://placehold.co/400x600?text=Receipt+Image'
  },
  {
    id: 'tx_789012',
    userId: 'u2',
    userName: 'Basic User',
    planId: 'Premium',
    amount: '₦10,000',
    method: 'USDT',
    status: PaymentStatus.PENDING,
    date: '2023-11-24',
    receiptUrl: 'https://placehold.co/400x600?text=USDT+Hash+Screenshot'
  }
];

const INITIAL_BLOG_POSTS: BlogPost[] = [
    {
        id: '1',
        title: 'How to Analyze Football Matches Like a Pro',
        excerpt: 'Discover the key statistics and factors that professional bettors use to consistently beat the bookies.',
        content: `<p>Analyzing football matches goes beyond just looking at the league table...</p>`,
        author: 'Ola The Oracle',
        date: '2023-11-20',
        imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0565c6da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        tier: SubscriptionTier.FREE
    },
    {
        id: '2',
        title: 'The Psychology of Discipline in Betting',
        excerpt: 'Why emotional control is more important than your strategy.',
        content: `<p>The biggest enemy of a bettor is not the bookie, but their own emotions...</p>`,
        author: 'Admin User',
        date: '2023-11-18',
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        tier: SubscriptionTier.STANDARD
    },
    {
        id: '3',
        title: 'Premium Insight: Weekend Value Picks',
        excerpt: 'Exclusive high-value opportunities identified by our AI model.',
        content: `<p>This weekend presents some unique opportunities where bookmakers have mispriced certain outcomes...</p>`,
        author: 'Ola The Oracle',
        date: '2023-11-24',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        tier: SubscriptionTier.PREMIUM
    }
];

// --- STORAGE SERVICE ---
const STORAGE_KEYS = {
  USERS: 'heptabet_users_v1',
  PREDICTIONS: 'heptabet_predictions_v1',
  TRANSACTIONS: 'heptabet_transactions_v1',
  BLOG_POSTS: 'heptabet_blog_posts_v1',
  INITIALIZED: 'heptabet_initialized_v1'
};

export const StorageService = {
  init: () => {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(STORAGE_KEYS.PREDICTIONS, JSON.stringify(INITIAL_PREDICTIONS));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      localStorage.setItem(STORAGE_KEYS.BLOG_POSTS, JSON.stringify(INITIAL_BLOG_POSTS));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  },

  getData: <T>(key: string, defaultData: T): T => {
    if (typeof window === 'undefined') return defaultData;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultData;
  },

  setData: <T>(key: string, data: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  },

  getUsers: () => StorageService.getData<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS),
  saveUsers: (users: User[]) => StorageService.setData(STORAGE_KEYS.USERS, users),

  getPredictions: () => StorageService.getData<Prediction[]>(STORAGE_KEYS.PREDICTIONS, INITIAL_PREDICTIONS),
  savePredictions: (predictions: Prediction[]) => StorageService.setData(STORAGE_KEYS.PREDICTIONS, predictions),

  getTransactions: () => StorageService.getData<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS),
  saveTransactions: (txs: PaymentTransaction[]) => StorageService.setData(STORAGE_KEYS.TRANSACTIONS, txs),

  getBlogPosts: () => StorageService.getData<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, INITIAL_BLOG_POSTS),
  saveBlogPosts: (posts: BlogPost[]) => StorageService.setData(STORAGE_KEYS.BLOG_POSTS, posts)
};