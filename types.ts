export enum SubscriptionTier {
  FREE = 'Free',
  BASIC = 'Basic',
  STANDARD = 'Standard',
  PREMIUM = 'Premium'
}

export interface User {
  id: string;
  name: string; // Used as Username
  email: string;
  phoneNumber?: string;
  subscription: SubscriptionTier;
  role: 'user' | 'admin';
  avatarUrl?: string;
  joinDate: string;
  subscriptionExpiryDate?: string | null;
}

export interface Tipster {
  id: string;
  name: string;
  bio: string;
  winRate: number;
  totalTips: number;
  imageUrl: string;
  specialty: string;
}

export enum MatchStatus {
  SCHEDULED = 'Scheduled',
  LIVE = 'Live',
  FINISHED = 'Finished'
}

export enum PredictionResult {
  PENDING = 'Pending',
  WON = 'Won',
  LOST = 'Lost',
  VOID = 'Void'
}

export interface Prediction {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  tip: string;
  odds: number;
  confidence: number; // 1-10
  minTier: SubscriptionTier; // Changed from isPremium boolean to specific tier requirement
  status: MatchStatus;
  result: PredictionResult;
  tipsterId: string;
  analysis?: string; // AI or Tipster analysis
  score?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  description?: string;
  features: string[];
  recommended?: boolean;
}

export enum PaymentStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  planId: string;
  amount: string;
  method: 'Bank Transfer' | 'USDT';
  status: PaymentStatus;
  date: string;
  receiptUrl: string; // URL or Base64
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageUrl: string;
  tier: SubscriptionTier;
}