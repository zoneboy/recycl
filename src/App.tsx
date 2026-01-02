import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import PredictionCard from './components/PredictionCard';
import { PLANS, MOCK_TIPSTERS } from './services/mockData'; // Only constant Plans and Tipster info remain
import { api } from './services/api';
import { User, SubscriptionTier, Prediction, PredictionResult, MatchStatus, PaymentTransaction, PaymentStatus, BlogPost } from './types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Check, Star, Shield, TrendingUp, Users, Plus, Trash2, Edit2, Save, X, CreditCard, Upload, ExternalLink, Copy, CheckCircle, Zap, UserPlus, AlertTriangle, Calendar, ArrowLeft, Mail, Lock, Phone, User as UserIcon, XCircle, List, Settings, Bell, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, MapPin, Trophy, BookOpen, PieChart, Eye, FileText } from 'lucide-react';

// --- Helper Functions ---
const getTierWeight = (tier: SubscriptionTier) => {
  switch (tier) {
    case SubscriptionTier.PREMIUM: return 3;
    case SubscriptionTier.STANDARD: return 2;
    case SubscriptionTier.BASIC: return 1;
    case SubscriptionTier.FREE: return 0;
    default: return 0;
  }
};

const getTierBadgeColor = (tier: SubscriptionTier) => {
  switch(tier) {
      case SubscriptionTier.PREMIUM: return 'bg-purple-100 text-purple-800 border-purple-200';
      case SubscriptionTier.STANDARD: return 'bg-blue-100 text-blue-800 border-blue-200';
      case SubscriptionTier.BASIC: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
  }
};

// --- Modal Components ---

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in-up">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <Trash2 className="text-red-600" size={24} />
        </div>
        <h3 className="text-lg font-bold text-center text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-center text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const AddPredictionModal: React.FC<{onClose: () => void, onAdd: (p: Prediction) => void}> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState<Partial<Prediction>>({
        league: '', homeTeam: '', awayTeam: '', date: '', time: '', tip: '', odds: 1.5, confidence: 5, minTier: SubscriptionTier.FREE
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newPrediction: Prediction = {
            id: `p_${Date.now()}`,
            ...formData as any,
            status: MatchStatus.SCHEDULED,
            result: PredictionResult.PENDING,
            tipsterId: 't1' // Default admin
        };
        try {
            await api.addPrediction(newPrediction);
            onAdd(newPrediction);
        } catch (e) {
            alert('Failed to add prediction');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Add New Prediction</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Home Team</label>
                            <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, homeTeam: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Away Team</label>
                            <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, awayTeam: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">League</label>
                            <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, league: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tip</label>
                            <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, tip: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Odds</label>
                            <input type="number" step="0.01" className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, odds: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Conf (1-10)</label>
                            <input type="number" min="1" max="10" className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, confidence: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tier</label>
                            <select className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" onChange={e => setFormData({...formData, minTier: e.target.value as SubscriptionTier})}>
                                {Object.values(SubscriptionTier).map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                            <input type="date" className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Time</label>
                            <input type="time" className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, time: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 border border-gray-300 p-2 rounded text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 bg-naija-green text-white p-2 rounded font-bold hover:bg-green-700">Add Prediction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddBlogPostModal: React.FC<{onClose: () => void, onAdd: (b: BlogPost) => void}> = ({ onClose, onAdd }) => {
    const [formData, setFormData] = useState<Partial<BlogPost>>({
        title: '', excerpt: '', content: '', author: 'Admin', tier: SubscriptionTier.FREE, imageUrl: 'https://placehold.co/600x400'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newPost: BlogPost = {
            id: `b_${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            ...formData as any
        };
        try {
            await api.addBlogPost(newPost);
            onAdd(newPost);
        } catch (e) {
            alert('Failed to add post');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Add Blog Post</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                        <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" required onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Excerpt</label>
                        <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" rows={2} required onChange={e => setFormData({...formData, excerpt: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Content (HTML Supported)</label>
                        <textarea className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green font-mono text-sm" rows={6} required onChange={e => setFormData({...formData, content: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Access Tier</label>
                            <select className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" onChange={e => setFormData({...formData, tier: e.target.value as SubscriptionTier})}>
                                {Object.values(SubscriptionTier).map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Image URL</label>
                            <input className="w-full border border-gray-300 p-2 rounded focus:ring-naija-green focus:border-naija-green" onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                         </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 border border-gray-300 p-2 rounded text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="flex-1 bg-naija-green text-white p-2 rounded font-bold hover:bg-green-700">Publish Post</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Page Components ---

const HomePage: React.FC<{user: User | null, predictions: Prediction[]}> = ({ user, predictions }) => {
  const navigate = useNavigate();
  const featuredPredictions = predictions.slice(0, 3);

  // Dynamic Accuracy Calculation
  const settledPredictions = predictions.filter(p => p.result === PredictionResult.WON || p.result === PredictionResult.LOST);
  const wonPredictions = settledPredictions.filter(p => p.result === PredictionResult.WON);
  // Default to 85% if no settled games to avoid 0% on fresh state, otherwise calculate
  const accuracyRate = settledPredictions.length > 0 
    ? Math.round((wonPredictions.length / settledPredictions.length) * 100) 
    : 85;

  return (
    <div className="bg-slate-50 font-sans selection:bg-naija-green selection:text-white">
      {/* Modern Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden bg-gray-900">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-naija-green/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 z-0 opacity-10" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            #1 Football Prediction Platform
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Predict the Game.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-naija-green to-emerald-300">Own the Outcome.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Get accurate daily tips, expert analysis, and AI-powered insights for Premier League, La Liga, and more. Join over 50,000 winners today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
                onClick={() => navigate('/predictions')} 
                className="group relative px-8 py-4 bg-naija-green rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-1 transition-all duration-200 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative">View Today's Tips</span>
            </button>
            
            {(!user || user.subscription === SubscriptionTier.FREE) ? (
              <button 
                onClick={() => navigate('/pricing')} 
                className="px-8 py-4 rounded-xl text-white font-bold text-lg border border-white/20 hover:bg-white/5 transition-all duration-200 flex items-center gap-2"
              >
                Join Premium
                <ChevronRight size={20} className="text-naija-green" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-8 py-4 rounded-xl text-white font-bold text-lg border border-white/20 hover:bg-white/5 transition-all duration-200"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Floating Stats Section */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 -mt-20">
        <div className="bg-white rounded-2xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border border-gray-100">
            {[
                { label: 'Accuracy Rate', value: `${accuracyRate}%`, icon: <CheckCircle2 className="text-emerald-500" /> },
                { label: 'Active Users', value: '50K+', icon: <Users className="text-blue-500" /> },
                { label: 'Expert Support', value: '24/7', icon: <MessageSquare className="text-purple-500" /> },
                { label: 'Specialists', value: 'NPFL', icon: <Trophy className="text-amber-500" /> },
            ].map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group hover:transform hover:scale-105 transition-transform duration-300">
                    <div className="mb-3 p-3 bg-gray-50 rounded-full group-hover:bg-gray-100 transition-colors shadow-sm">
                        {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 24 })}
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{stat.value}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </div>
            ))}
        </div>
      </div>

      {/* Featured Tips Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Featured Predictions</h2>
                    <p className="text-gray-500 text-lg max-w-xl">Curated high-confidence tips powered by our expert analysis and AI algorithms.</p>
                </div>
                <button onClick={() => navigate('/predictions')} className="hidden md:flex items-center text-naija-green font-bold hover:text-emerald-700 transition group mt-4 md:mt-0">
                    View all matches <ArrowLeft className="ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredPredictions.map(p => (
                    <div key={p.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                        <PredictionCard 
                            prediction={p} 
                            user={user} 
                            onSubscribeClick={() => navigate('/pricing')}
                        />
                    </div>
                ))}
            </div>
            
            <div className="mt-12 text-center md:hidden">
                <button onClick={() => navigate('/predictions')} className="bg-white border border-gray-200 text-gray-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-50 transition w-full shadow-sm">
                    View all matches
                </button>
            </div>
        </div>
      </section>

       {/* Why Choose Section - Dark/Contrast */}
       <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-naija-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Why Bettors Trust Heptabet</h2>
                <p className="text-gray-400 text-lg leading-relaxed">We don't rely on luck. Our methodology is built on data science, deep squad knowledge, and real-time market tracking.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        title: "Expert Analysis",
                        desc: "Our lead analyst is a veteran with a proven track record in both local NPFL and international leagues.",
                        icon: <Users size={32} className="text-emerald-400" />
                    },
                    {
                        title: "Data Driven",
                        desc: "We analyze head-to-head stats, current form, injuries, and market trends before posting any tip.",
                        icon: <TrendingUp size={32} className="text-blue-400" />
                    },
                    {
                        title: "Verified History",
                        desc: "Transparency is key. We track and publish all our wins and losses so you know exactly how we perform.",
                        icon: <Shield size={32} className="text-purple-400" />
                    }
                ].map((feature, idx) => (
                    <div key={idx} className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors duration-300">
                        <div className="mb-6 bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center border border-white/5">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

const PredictionsPage: React.FC<{user: User | null, predictions: Prediction[]}> = ({ user, predictions }) => {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Date navigation handlers
    const handleDateChange = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    // Filter by date
    const filteredPredictions = predictions.filter(p => p.date === selectedDate);
    // Sort by time
    filteredPredictions.sort((a, b) => a.time.localeCompare(b.time));

    // Access logic helper
    const userTierWeight = user ? getTierWeight(user.subscription) : 0;

    return (
        <div className="py-12 px-4 max-w-7xl mx-auto">
            {/* Header & Date Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900">Daily Predictions</h1>
                    <p className="text-gray-500 mt-1">Expert tips for {selectedDate === today ? 'Today' : selectedDate}</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="relative">
                        <input 
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-3 py-1.5 font-medium text-gray-700 focus:outline-none focus:bg-gray-50 rounded-md border-transparent focus:border-gray-300 text-sm w-40 cursor-pointer"
                        />
                         <Calendar className="absolute left-2.5 top-2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600 transition">
                        <ChevronRight size={20} />
                    </button>
                    {selectedDate !== today && (
                        <button 
                            onClick={() => setSelectedDate(today)}
                            className="px-3 py-1.5 ml-2 text-xs font-bold text-white bg-naija-green rounded-md hover:bg-green-700 transition"
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

             {/* Table View */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {filteredPredictions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time & League</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Match</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Odds</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPredictions.map(p => {
                                    const predictionTierWeight = getTierWeight(p.minTier);
                                    const isSettled = p.result !== PredictionResult.PENDING;
                                    const canView = p.minTier === SubscriptionTier.FREE || userTierWeight >= predictionTierWeight || isSettled;

                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900 mb-0.5">{p.time}</span>
                                                    <span className="text-xs text-gray-500 font-medium">{p.league}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                 <div className="flex flex-col">
                                                     <div className="text-sm font-bold text-gray-900">{p.homeTeam}</div>
                                                     <div className="text-sm text-gray-500 flex items-center gap-1">
                                                         <span className="text-xs">vs</span> {p.awayTeam}
                                                     </div>
                                                 </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {canView ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-sm font-bold text-naija-green">{p.tip}</span>
                                                        <div className="flex gap-2">
                                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                                Conf: {p.confidence}/10
                                                            </span>
                                                             {p.minTier !== SubscriptionTier.FREE && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTierBadgeColor(p.minTier)}`}>
                                                                    {p.minTier}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-1 cursor-pointer" onClick={() => navigate('/pricing')}>
                                                        <div className="flex items-center text-gray-400">
                                                            <Lock size={14} className="mr-1.5" />
                                                            <span className="text-sm font-medium italic">Premium Tip</span>
                                                        </div>
                                                        <button 
                                                            className="text-[10px] bg-naija-green text-white px-2 py-0.5 rounded hover:bg-green-700 transition"
                                                        >
                                                            Unlock {p.minTier}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {p.odds.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {p.result === PredictionResult.WON && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                                        <CheckCircle2 size={12} className="mr-1" /> WON
                                                    </span>
                                                )}
                                                {p.result === PredictionResult.LOST && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                                        <XCircle size={12} className="mr-1" /> LOST
                                                    </span>
                                                )}
                                                {p.result === PredictionResult.PENDING && p.status === MatchStatus.LIVE && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-600 animate-pulse border border-red-200">
                                                        LIVE
                                                    </span>
                                                )}
                                                {p.result === PredictionResult.PENDING && p.status !== MatchStatus.LIVE && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        {p.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                             </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-gray-500">
                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                            <Calendar size={32} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-900">No predictions found</p>
                        <p className="text-sm text-gray-500 mt-1">We haven't posted any tips for {selectedDate} yet.</p>
                        {selectedDate !== today && (
                             <button onClick={() => setSelectedDate(today)} className="mt-4 text-naija-green font-medium hover:underline">
                                Return to Today
                             </button>
                        )}
                    </div>
                )}
             </div>
        </div>
    );
};

const ExpertPage: React.FC<{predictions: Prediction[]}> = ({ predictions }) => {
  const expert = MOCK_TIPSTERS[0];
  const wins = predictions.filter(p => p.result === PredictionResult.WON).length;
  const total = predictions.filter(p => p.result !== PredictionResult.PENDING).length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 82;

  return (
    <div className="bg-white min-h-screen">
       <div className="bg-gray-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
             <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-naija-green shadow-2xl flex-shrink-0">
                <img src={expert.imageUrl} alt={expert.name} className="w-full h-full object-cover" />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-4xl font-bold">{expert.name}</h1>
                   <span className="px-3 py-1 bg-naija-green text-xs font-bold rounded-full uppercase tracking-wider">The Oracle</span>
                </div>
                <p className="text-xl text-gray-400 mb-6 max-w-2xl">{expert.bio}</p>
                <div className="flex gap-8">
                   <div>
                      <div className="text-3xl font-bold text-naija-green">{winRate}%</div>
                      <div className="text-sm text-gray-400 uppercase tracking-wider">Win Rate</div>
                   </div>
                   <div>
                      <div className="text-3xl font-bold text-white">{expert.totalTips}+</div>
                      <div className="text-sm text-gray-400 uppercase tracking-wider">Winning Tips</div>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

const PricingPage: React.FC<{user: User | null}> = ({ user }) => {
    const navigate = useNavigate();

    const handleSubscribe = (planName: string) => {
        if (!user) {
            navigate('/login');
            return;
        }
        navigate('/dashboard', { state: { activeTab: 'payment', selectedPlan: planName } });
    };

    return (
        <div className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Winning Strategy</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">Investment-grade football predictions for every budget.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {PLANS.map(plan => {
                        const isCurrent = user?.subscription.toLowerCase() === plan.id;
                        return (
                            <div key={plan.id} className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-transform hover:-translate-y-2 ${plan.recommended ? 'border-naija-green relative' : 'border-transparent'}`}>
                                {plan.recommended && <div className="bg-naija-green text-white text-center text-xs font-bold py-1 uppercase tracking-wider">Recommended</div>}
                                <div className="p-8">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="text-4xl font-extrabold text-gray-900 mb-6">{plan.price}<span className="text-base font-normal text-gray-500">/mo</span></div>
                                    <p className="text-gray-500 mb-8 min-h-[50px]">{plan.description || `Access to ${plan.name} tier predictions.`}</p>
                                    
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start">
                                                <CheckCircle2 size={20} className="text-naija-green mr-3 flex-shrink-0" />
                                                <span className="text-gray-600 text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    <button 
                                        disabled={isCurrent}
                                        onClick={() => handleSubscribe(plan.name)}
                                        className={`w-full py-3 rounded-lg font-bold transition-colors ${
                                            isCurrent 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {isCurrent ? 'Current Plan' : 'Select Plan'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const BlogPage: React.FC<{blogPosts: BlogPost[]}> = ({ blogPosts }) => {
    const navigate = useNavigate();
    return (
        <div className="py-12 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Betting Insights & News</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map(post => (
                        <div key={post.id} onClick={() => navigate(`/blog/${post.id}`)} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group">
                             <div className="h-48 overflow-hidden">
                                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             </div>
                             <div className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${getTierBadgeColor(post.tier)}`}>{post.tier} Content</span>
                                    <span className="text-xs text-gray-400">{post.date}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-naija-green transition-colors">{post.title}</h2>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                                <span className="text-naija-green text-sm font-semibold flex items-center">Read Article <ArrowLeft className="ml-2 w-4 h-4 rotate-180" /></span>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BlogPostPage: React.FC<{user: User | null, blogPosts: BlogPost[]}> = ({ user, blogPosts }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const post = blogPosts.find(p => p.id === id);

    if (!post) return <div className="p-12 text-center">Post not found</div>;

    const canView = post.tier === SubscriptionTier.FREE || (user && getTierWeight(user.subscription) >= getTierWeight(post.tier));

    return (
        <div className="bg-white min-h-screen py-12">
            <article className="max-w-3xl mx-auto px-4">
                <button onClick={() => navigate('/blog')} className="text-gray-500 hover:text-gray-900 flex items-center mb-8">
                    <ArrowLeft size={20} className="mr-2" /> Back to Blog
                </button>
                
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post.title}</h1>
                
                <div className="flex items-center gap-4 mb-8 text-sm border-b border-gray-100 pb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                            {post.author.charAt(0)}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900">{post.author}</div>
                            <div className="text-gray-500">{post.date}</div>
                        </div>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${getTierBadgeColor(post.tier)}`}>
                        {post.tier}
                    </span>
                </div>

                <div className="w-full h-80 rounded-xl overflow-hidden mb-8">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                </div>

                {canView ? (
                    <div className="prose prose-lg prose-green max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: post.content }} />
                ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                        <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium Content</h3>
                        <p className="text-gray-600 mb-6">You need a {post.tier} subscription to read this article.</p>
                        <button onClick={() => navigate('/pricing')} className="bg-naija-green text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-600 transition">
                            Upgrade Now
                        </button>
                    </div>
                )}
            </article>
        </div>
    );
};

const DashboardPage: React.FC<{ 
    user: User | null, 
    predictions: Prediction[], 
    transactions: PaymentTransaction[],
    setTransactions: React.Dispatch<React.SetStateAction<PaymentTransaction[]>>
}> = ({ user, predictions, transactions, setTransactions }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Payment upload state
    const [selectedPlan, setSelectedPlan] = useState(PLANS[1].id);
    const [amount, setAmount] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    if (!user) return null;

    // --- Analytics Logic ---
    const userTierWeight = getTierWeight(user.subscription);
    
    // 1. Get predictions accessible to the user
    const accessiblePredictions = predictions.filter(p => 
        p.minTier === SubscriptionTier.FREE || userTierWeight >= getTierWeight(p.minTier)
    );

    // Dynamic Chart Data Generation (Last 7 Days)
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const last7Days = getLast7Days();
    const chartData = last7Days.map(date => {
        const dayPreds = accessiblePredictions.filter(p => p.date === date);
        const dayWins = dayPreds.filter(p => p.result === PredictionResult.WON).length;
        const dayLosses = dayPreds.filter(p => p.result === PredictionResult.LOST).length;
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        return { name: dayName, won: dayWins, lost: dayLosses };
    });

    const myTransactions = transactions.filter(t => t.userId === user.id);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newTx: PaymentTransaction = {
            id: `tx_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            planId: selectedPlan,
            amount: amount,
            method: 'Bank Transfer',
            status: PaymentStatus.PENDING,
            date: new Date().toISOString().slice(0, 10),
            receiptUrl: receiptUrl || 'https://placehold.co/400?text=Receipt'
        };
        try {
            await api.addTransaction(newTx);
            setTransactions([newTx, ...transactions]);
            alert("Payment submitted! pending admin approval.");
            setActiveTab('history');
            // Reset form
            setAmount('');
            setReceiptUrl('');
            setReceiptFile(null);
        } catch (e) {
            alert('Failed to submit payment');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
             <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}</h1>
                    <p className="text-gray-500 mt-1">Manage your account and subscriptions.</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-naija-green text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Overview
                    </button>
                     <button 
                      onClick={() => setActiveTab('payment')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'payment' || activeTab === 'history' ? 'bg-naija-green text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Subscription & Payment
                    </button>
                </div>
             </div>

             {activeTab === 'overview' ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                       {/* Left Col: Account */}
                       <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
                          <h3 className="font-bold text-gray-900 mb-6">My Account</h3>
                          <div className="flex items-center gap-4 mb-8">
                             <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                                {user.name.charAt(0)}
                             </div>
                             <div>
                                <div className="font-bold text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                <div className="text-sm text-gray-500">{user.phoneNumber || '08099988877'}</div>
                             </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Current Plan</span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${getTierBadgeColor(user.subscription)}`}>
                                    {user.subscription}
                                </span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Expires On</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {user.subscriptionExpiryDate ? new Date(user.subscriptionExpiryDate).toLocaleDateString() : 'N/A'}
                                </span>
                             </div>
                          </div>
                       </div>

                       {/* Right Col: Performance Chart */}
                       <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
                          <h3 className="font-bold text-gray-900 mb-6">Your Betting Performance (Last 7 Days)</h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} allowDecimals={false} />
                                  <Tooltip cursor={{fill: '#F3F4F6'}} />
                                  <Legend />
                                  <Bar dataKey="won" fill="#008751" radius={[4, 4, 0, 0]} name="Won" />
                                  <Bar dataKey="lost" fill="#EF4444" radius={[4, 4, 0, 0]} name="Lost" />
                               </BarChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                    </div>
                    
                    {/* Bottom Row: Latest Tips */}
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Your Latest Tips</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {accessiblePredictions.slice(0, 5).map(p => (
                                 <div key={p.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    {/* Tip Row Design */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                       <div>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                             <span className="font-bold text-gray-900">{p.league}</span>
                                             <span>•</span>
                                             <span>{p.date}</span>
                                          </div>
                                          <div className="font-bold text-lg text-gray-900">{p.homeTeam} vs {p.awayTeam}</div>
                                       </div>
                                       <div className="flex items-center gap-6">
                                          <div className="text-right">
                                             <div className="text-xs text-gray-500 uppercase tracking-wide">Prediction</div>
                                             <div className="font-bold text-naija-green">{p.tip}</div>
                                          </div>
                                           <div className="text-right">
                                             <div className="text-xs text-gray-500 uppercase tracking-wide">Odds</div>
                                             <div className="font-bold text-gray-900">{p.odds}</div>
                                          </div>
                                          <div>
                                             <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
                                                {p.status}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                            ))}
                            {accessiblePredictions.length === 0 && (
                                <div className="p-8 text-center text-gray-500">No tips available in your history yet.</div>
                            )}
                        </div>
                     </div>
                 </div>
             ) : (
                <div className="space-y-8">
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-2xl mx-auto">
                       <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade / Renew Subscription</h2>
                       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-sm text-yellow-800">
                            <p className="font-bold flex items-center"><AlertTriangle size={16} className="mr-2"/> Bank Transfer Instructions:</p>
                            <p className="mt-1">Bank: GTBank</p>
                            <p>Account: 0123456789</p>
                            <p>Name: Heptabet Ventures</p>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan</label>
                                <select 
                                    className="w-full border-gray-300 rounded-lg focus:ring-naija-green focus:border-naija-green"
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                >
                                    {PLANS.map(p => <option key={p.id} value={p.id}>{p.name} - {p.price}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₦)</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full border-gray-300 rounded-lg focus:ring-naija-green focus:border-naija-green"
                                    placeholder="e.g., 5000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {receiptUrl ? (
                                                <div className="relative">
                                                     <CheckCircle className="text-green-500 w-8 h-8 mb-2" />
                                                     <p className="text-sm text-gray-500">{receiptFile?.name || 'Image selected'}</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> payment proof</p>
                                                    <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                            <button type="submit" disabled={!receiptUrl || !amount} className="w-full bg-naija-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                                Submit Payment Proof
                            </button>
                        </form>
                   </div>
                   
                   <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                       <div className="p-6 border-b border-gray-100"><h3 className="font-bold">Payment History</h3></div>
                        {myTransactions.length === 0 ? (
                             <p className="p-6 text-gray-500">No transactions found.</p>
                         ) : (
                             <div className="divide-y divide-gray-100">
                                 {myTransactions.map(tx => (
                                     <div key={tx.id} className="flex items-center justify-between p-6 hover:bg-gray-50">
                                         <div>
                                             <div className="font-bold text-gray-900">{tx.planId} Subscription</div>
                                             <div className="text-sm text-gray-500">{tx.date}</div>
                                         </div>
                                         <div className="text-right">
                                             <div className="font-bold text-gray-900">{tx.amount}</div>
                                             <span className={`text-xs px-2 py-1 rounded-full ${
                                                 tx.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-800' :
                                                 tx.status === PaymentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                                                 'bg-yellow-100 text-yellow-800'
                                             }`}>{tx.status}</span>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                   </div>
                </div>
             )}
        </div>
    );
};

const LoginPage: React.FC<{onLogin: (user: User) => void}> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
          const { user, token } = await api.login(email, password);
          localStorage.setItem('token', token);
          onLogin(user);
      } catch (e) {
          setError('Invalid email or password');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to access your dashboard</p>
        </div>
        
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
             <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                  placeholder="Enter your email"
                  required
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
             <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                  placeholder="Enter your password"
                  required
                />
            </div>
             <div className="flex justify-end mt-1">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-naija-green hover:underline">Forgot Password?</button>
             </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-naija-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-100 disabled:opacity-70"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don't have an account? <button onClick={() => navigate('/register')} className="text-naija-green font-medium hover:underline ml-1">Register Now</button>
        </div>
      </div>
    </div>
  );
};

const RegisterPage: React.FC<{onRegister: (user: User) => void}> = ({ onRegister }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setIsSending(true);
        try {
            const { user, token } = await api.register(username, email, phoneNumber, password);
            localStorage.setItem('token', token);
            onRegister(user);
        } catch (e) {
            setError("Registration failed. Email might be in use.");
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Create an Account</h1>
                    <p className="text-gray-500 mt-2">Start your winning streak with Heptabet.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-fade-in">
                        <AlertTriangle size={20} className="mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
                
                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="tel" 
                                value={phoneNumber}
                                onChange={(e) => { setPhoneNumber(e.target.value); setError(null); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                                placeholder="080..."
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                                placeholder="Create a password"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                                placeholder="Repeat password"
                                required
                            />
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isSending}
                        className="w-full bg-naija-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-70 shadow-lg shadow-green-100"
                    >
                        {isSending ? 'Creating Account...' : 'Register'}
                    </button>
                </form>
                
                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account? <button onClick={() => navigate('/login')} className="text-naija-green font-medium hover:underline ml-1">Sign In</button>
                </div>
            </div>
        </div>
    );
};

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Simulate API call
    setTimeout(() => {
        // success
    }, 1000);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 mt-2">Enter your email to receive reset instructions.</p>
        </div>
        
        {submitted ? (
             <div className="text-center">
                 <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Mail size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
                 <p className="text-gray-500 mb-6">We have sent a password reset link to <strong>{email}</strong></p>
                 <button onClick={() => navigate('/login')} className="text-naija-green font-bold hover:underline">
                     Back to Sign In
                 </button>
             </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none transition"
                      placeholder="Enter your email"
                      required
                    />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-naija-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-100"
              >
                Send Reset Link
              </button>
              <div className="text-center">
                   <button type="button" onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-900">
                     Back to Sign In
                   </button>
              </div>
            </form>
        )}
      </div>
    </div>
  );
};

const ContactPage: React.FC = () => {
    const [submitted, setSubmitted] = useState(false);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="py-16 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
                <p className="text-xl text-gray-500">Have questions about our VIP plans or need support? We're here to help.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                    <div className="space-y-6">
                        <div className="flex items-start">
                            <div className="bg-green-100 p-3 rounded-lg mr-4">
                                <Mail className="text-naija-green" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Email Us</h3>
                                <p className="text-gray-600">support@heptabet.com</p>
                                <p className="text-gray-600">vip@heptabet.com</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="bg-green-100 p-3 rounded-lg mr-4">
                                <MessageSquare className="text-naija-green" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">WhatsApp Support</h3>
                                <p className="text-gray-600">08133262312</p>
                                <p className="text-sm text-gray-500">Available Mon-Fri, 9am - 6pm</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    {submitted ? (
                        <div className="text-center py-12">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-naija-green" size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                            <p className="text-gray-600">Thank you for reaching out. Our team will get back to you within 24 hours.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none" placeholder="your@email.com" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none">
                                    <option>General Inquiry</option>
                                    <option>VIP Subscription Help</option>
                                    <option>Payment Issue</option>
                                    <option>Technical Support</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea required rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naija-green focus:border-naija-green outline-none" placeholder="How can we help you?"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-naija-green text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
                                Send Message
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const TermsPage: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-green max-w-none">
            <p><strong>Last Updated: November 2023</strong></p>
            <h3>1. Introduction</h3>
            <p>Welcome to Heptabet. By accessing our website, you agree to be bound by these Terms of Service.</p>
            
            <h3>2. Betting Disclaimer</h3>
            <p>Heptabet provides predictions for informational purposes only. We do not guarantee winnings. Betting involves risk, and you should only bet what you can afford to lose.</p>
            
            <h3>3. Subscriptions</h3>
            <p>Premium subscriptions are billed monthly. Refunds are processed according to our Money-Back Guarantee policy within the first 7 days.</p>
            
            <h3>4. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
        </div>
    </div>
);

const PrivacyPage: React.FC = () => (
    <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 prose prose-green max-w-none">
            <h3>1. Information We Collect</h3>
            <p>We collect information you provide directly to us, such as when you create an account, subscribe to our service, or contact us for support.</p>
            
            <h3>2. How We Use Your Information</h3>
            <p>We use your information to provide, maintain, and improve our services, process transactions, and send you technical notices.</p>
            
            <h3>3. Data Security</h3>
            <p>We implement reasonable security measures to protect your personal information.</p>
        </div>
    </div>
);

const AdminDashboardPage: React.FC<{
  user: User | null;
  predictions: Prediction[];
  setPredictions: React.Dispatch<React.SetStateAction<Prediction[]>>;
  transactions: PaymentTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<PaymentTransaction[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  blogPosts: BlogPost[];
  setBlogPosts: React.Dispatch<React.SetStateAction<BlogPost[]>>;
}> = ({ user, predictions, setPredictions, transactions, setTransactions, users, setUsers, blogPosts, setBlogPosts }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('predictions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'prediction' | 'user' | 'blog' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  
  // Admin Notification Settings State
  const [adminSettings, setAdminSettings] = useState({
    emailNotifications: {
      newPayment: true,
      subscriptionExpiry: false,
      newUser: true
    },
    inAppNotifications: {
      newPayment: true,
      subscriptionExpiry: true,
      newUser: false
    }
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  // -- Handlers --

  const handleAddPrediction = (newPrediction: Prediction) => {
    setPredictions(prev => [newPrediction, ...prev]);
    setShowAddModal(false);
  };

  const handleAddBlogPost = (newPost: BlogPost) => {
    setBlogPosts(prev => [newPost, ...prev]);
    setShowAddBlogModal(false);
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    if (deleteModal.type === 'prediction') {
        await api.deletePrediction(deleteModal.id);
        setPredictions(prev => prev.filter(p => p.id !== deleteModal.id));
    } else if (deleteModal.type === 'user') {
        // await api.deleteUser(deleteModal.id);
        setUsers(prev => prev.filter(u => u.id !== deleteModal.id));
    } else if (deleteModal.type === 'blog') {
        // await api.deleteBlog(deleteModal.id);
        setBlogPosts(prev => prev.filter(b => b.id !== deleteModal.id));
    }
    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  const openDeleteModal = (type: 'prediction' | 'user' | 'blog', id: string) => {
      setDeleteModal({ isOpen: true, type, id });
  };

  const openReceiptModal = (url: string) => {
      setSelectedReceiptUrl(url);
      setReceiptModalOpen(true);
  };

  const handleApproveTransaction = async (id: string) => {
    await api.updateTransactionStatus(id, PaymentStatus.APPROVED);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: PaymentStatus.APPROVED } : t));
  };

  const handleRejectTransaction = async (id: string) => {
    await api.updateTransactionStatus(id, PaymentStatus.REJECTED);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: PaymentStatus.REJECTED } : t));
  };

  const handleUpdateStatus = async (id: string, status: MatchStatus) => {
    await api.updatePredictionStatus(id, status);
    setPredictions(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };
  
  const handleUpdateResult = async (id: string, result: PredictionResult) => {
    await api.updatePredictionResult(id, result);
    setPredictions(prev => prev.map(p => p.id === id ? { ...p, result } : p));
  };

  const handleUpgradeUser = (userId: string, tier: SubscriptionTier) => {
      // API Call needed here
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription: tier } : u));
  };

  const handleUpdateExpiry = (userId: string, newDate: string) => {
      // API call needed here
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionExpiryDate: newDate } : u));
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
           <p className="text-gray-500">Manage predictions, users, and settings.</p>
        </div>
        
        {/* Context Aware Actions */}
        <div className="flex gap-2">
            {activeTab === 'predictions' && (
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-naija-green text-white px-4 py-2 rounded-lg font-medium flex items-center hover:bg-green-700 transition shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> New Prediction
                </button>
            )}
            {activeTab === 'blog' && (
                <button 
                    onClick={() => setShowAddBlogModal(true)}
                    className="bg-naija-green text-white px-4 py-2 rounded-lg font-medium flex items-center hover:bg-green-700 transition shadow-sm"
                >
                    <Plus size={18} className="mr-2" /> New Post
                </button>
            )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium uppercase">Total Tips</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{predictions.length}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium uppercase">Pending Tips</div>
          <div className="text-3xl font-bold text-yellow-600 mt-1">
            {predictions.filter(p => p.result === PredictionResult.PENDING).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="text-gray-500 text-sm font-medium uppercase">Blog Posts</div>
           <div className="text-3xl font-bold text-blue-600 mt-1">
                {blogPosts.length}
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-sm font-medium uppercase">Total Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{users.length}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex gap-6 overflow-x-auto">
          {['predictions', 'payments', 'users', 'blog', 'settings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`font-medium pb-2 -mb-4 px-1 capitalize ${activeTab === tab ? 'text-naija-green border-b-2 border-naija-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'predictions' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {predictions.map(pred => (
                    <tr key={pred.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pred.date} <br/> <span className="text-xs">{pred.time}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pred.homeTeam} vs {pred.awayTeam}
                          <div className="text-xs text-gray-400 font-normal">{pred.league}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-bold">{pred.tip}</div>
                          <div className="text-xs text-gray-500">@{pred.odds.toFixed(2)} • {pred.minTier}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                         <select 
                            value={pred.status}
                            onChange={(e) => handleUpdateStatus(pred.id, e.target.value as MatchStatus)}
                            className="border-gray-300 rounded text-xs py-1 px-2 border focus:ring-naija-green focus:border-naija-green bg-white"
                         >
                            {Object.values(MatchStatus).map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                         </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                         <select 
                            value={pred.result}
                            onChange={(e) => handleUpdateResult(pred.id, e.target.value as PredictionResult)}
                            className={`border-gray-300 rounded text-xs py-1 px-2 border focus:ring-naija-green focus:border-naija-green font-bold
                              ${pred.result === PredictionResult.WON ? 'text-green-700 bg-green-50' : 
                                pred.result === PredictionResult.LOST ? 'text-red-700 bg-red-50' : 'text-gray-700 bg-white'}`}
                         >
                            {Object.values(PredictionResult).map(r => <option key={r as string} value={r as string}>{r as string}</option>)}
                         </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openDeleteModal('prediction', pred.id)} className="text-red-600 hover:text-red-900 p-2 bg-red-50 rounded hover:bg-red-100 transition">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'payments' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="font-bold">{tx.userName}</div>
                                    <div className="text-xs text-gray-500">{tx.date}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {tx.amount} <span className="text-xs text-gray-500">({tx.planId})</span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        tx.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-800' :
                                        tx.status === PaymentStatus.REJECTED ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>{tx.status}</span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end items-center gap-2">
                                     {tx.receiptUrl && (
                                        <button 
                                            onClick={() => openReceiptModal(tx.receiptUrl)} 
                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded" 
                                            title="View Receipt"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    )}
                                    {tx.status === PaymentStatus.PENDING && (
                                        <>
                                            <button onClick={() => handleApproveTransaction(tx.id)} className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded"><CheckCircle size={18} /></button>
                                            <button onClick={() => handleRejectTransaction(tx.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"><XCircle size={18} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          )}

          {activeTab === 'users' && (
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <select 
                                        value={u.subscription}
                                        onChange={(e) => handleUpgradeUser(u.id, e.target.value as SubscriptionTier)}
                                        className="text-xs border-gray-300 rounded py-1 px-2 border focus:ring-naija-green focus:border-naija-green bg-white"
                                    >
                                        {Object.values(SubscriptionTier).map(tier => (
                                            <option key={tier as string} value={tier as string}>{tier as string}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <input 
                                        type="date"
                                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-naija-green focus:border-naija-green w-32"
                                        value={u.subscriptionExpiryDate ? new Date(u.subscriptionExpiryDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => handleUpdateExpiry(u.id, e.target.value)}
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {u.id !== user.id && (
                                        <button onClick={() => openDeleteModal('user', u.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded hover:bg-red-100 transition">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          )}

          {activeTab === 'blog' && (
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {blogPosts.map(post => (
                            <tr key={post.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="font-bold">{post.title}</div>
                                    <div className="text-xs text-gray-500">{post.date}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTierBadgeColor(post.tier)}`}>
                                        {post.tier}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openDeleteModal('blog', post.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded hover:bg-red-100 transition">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
              </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h3>
               <div className="space-y-6">
                 <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="text-gray-500" size={20} />
                        <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-gray-700">New Payment Submissions</span>
                            <input 
                                type="checkbox" 
                                checked={adminSettings.emailNotifications.newPayment}
                                onChange={(e) => setAdminSettings({...adminSettings, emailNotifications: {...adminSettings.emailNotifications, newPayment: e.target.checked}})}
                                className="w-5 h-5 text-naija-green rounded focus:ring-naija-green border-gray-300"
                            />
                        </label>
                    </div>
                 </div>
                 <button className="bg-naija-green text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition">
                    Save Changes
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {showAddModal && <AddPredictionModal onClose={() => setShowAddModal(false)} onAdd={handleAddPrediction} />}
      {showAddBlogModal && <AddBlogPostModal onClose={() => setShowAddBlogModal(false)} onAdd={handleAddBlogPost} />}

      <DeleteConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null })} 
        onConfirm={confirmDelete} 
        title={`Delete Item`}
        message={`Are you sure you want to delete this item? This action cannot be undone.`}
      />

      {/* Receipt Modal */}
      {receiptModalOpen && selectedReceiptUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4" onClick={() => setReceiptModalOpen(false)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Payment Receipt</h3>
                    <button onClick={() => setReceiptModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto bg-gray-50 flex justify-center">
                    <img src={selectedReceiptUrl} alt="Receipt Proof" className="max-w-full h-auto rounded shadow-sm" />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Initial Data Fetch
  useEffect(() => {
    // 1. Check Session
    api.getCurrentUser().then(setUser);

    // 2. Fetch Public Data
    api.getPredictions().then(setPredictions);
    api.getBlogPosts().then(setBlogPosts);
  }, []);

  // Fetch Protected Data on User Change
  useEffect(() => {
    if (user) {
        api.getTransactions().then(setTransactions);
        if (user.role === 'admin') {
            api.getUsers().then(setUsers);
        }
    }
  }, [user]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      if (loggedInUser.role === 'admin') {
          navigate('/admin');
      } else {
          navigate('/dashboard');
      }
  };

  const handleRegister = (newUser: User) => {
      setUser(newUser);
      navigate('/dashboard');
  }

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  const getCurrentPageId = () => {
      const path = location.pathname;
      if (path === '/') return 'home';
      if (path.startsWith('/blog')) return 'blog';
      return path.substring(1);
  };

  return (
    <Layout 
        user={user} 
        onLogout={handleLogout} 
        currentPage={getCurrentPageId()}
        onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)}
    >
      <Routes>
        <Route path="/" element={<HomePage user={user} predictions={predictions} />} />
        <Route path="/predictions" element={<PredictionsPage user={user} predictions={predictions} />} />
        <Route path="/expert" element={<ExpertPage predictions={predictions} />} />
        <Route path="/pricing" element={<PricingPage user={user} />} />
        <Route path="/blog" element={<BlogPage blogPosts={blogPosts} />} />
        <Route path="/blog/:id" element={<BlogPostPage user={user} blogPosts={blogPosts} />} />
        <Route path="/dashboard" element={
            <DashboardPage 
                user={user} 
                predictions={predictions} 
                transactions={transactions} 
                setTransactions={setTransactions} 
            />
        } />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/admin" element={
          <AdminDashboardPage 
            user={user} 
            predictions={predictions} 
            setPredictions={setPredictions}
            transactions={transactions}
            setTransactions={setTransactions}
            users={users}
            setUsers={setUsers}
            blogPosts={blogPosts}
            setBlogPosts={setBlogPosts}
          />
        } />
      </Routes>
    </Layout>
  );
};

export default App;