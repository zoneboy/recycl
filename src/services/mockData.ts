import { Plan, Tipster, SubscriptionTier } from "../types";

export const MOCK_TIPSTERS: Tipster[] = [
  {
    id: 't1',
    name: 'Ola',
    bio: 'With over 15 years of experience analyzing major European leagues, Ola combines statistical depth with an instinct for value while treating betting as a business. He dedicates his expertise to helping bettors beat the bookies. His rigorous analysis of team form, injury news, and tactical matchups has earned him the nickname "The Oracle".',
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
    features: [
      'Daily Free Tips', 
      'Access to Basic Tier Predictions',
      'Basic Match Stats', 
      'Email Support'
    ],
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₦5,000/mo',
    description: 'Best for active bettors who want solid daily slips without over-staking.',
    features: [
      'Everything in Basic', 
      'Access to Standard & Basic Predictions',
      'Daily VIP Tips (3+)', 
      'Confidence level indicators',
      'Tipster Performance Stats'
    ],
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₦10,000/mo',
    description: 'Aggressive but controlled staking strategy for serious investors.',
    features: [
      'Everything in Standard', 
      'Access to ALL Predictions (Premium, Standard, Basic)',
      'Direct Expert Access', 
      'AI-Powered Analysis', 
      'Access to in-play prediction', 
      'Money-back guarantee',
      '24/7 priority support'
    ],
    recommended: false
  }
];