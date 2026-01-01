import React, { useState } from 'react';
import { Prediction, SubscriptionTier, User, PredictionResult, MatchStatus } from '../types';
import { Lock, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { generateMatchAnalysis } from '../services/geminiService';

interface PredictionCardProps {
  prediction: Prediction;
  user: User | null;
  onSubscribeClick: () => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, user, onSubscribeClick }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Helper to get tier weight
  const getTierWeight = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.PREMIUM: return 3;
      case SubscriptionTier.STANDARD: return 2;
      case SubscriptionTier.BASIC: return 1;
      case SubscriptionTier.FREE: return 0;
      default: return 0;
    }
  };

  const predictionTierWeight = getTierWeight(prediction.minTier);
  const userTierWeight = user ? getTierWeight(user.subscription) : 0;
  
  // Check if prediction is settled (Won, Lost, Void)
  const isSettled = prediction.result !== PredictionResult.PENDING;

  // Can view if prediction is free OR user's tier is greater than or equal to required tier OR prediction is settled
  const canView = prediction.minTier === SubscriptionTier.FREE || userTierWeight >= predictionTierWeight || isSettled;

  const getConfidenceColor = (score: number) => {
    if (score >= 9) return 'bg-green-100 text-green-800';
    if (score >= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleAIAnalysis = async () => {
    if (!user) {
        onSubscribeClick(); 
        return;
    }
    if (loadingAnalysis) return;
    setLoadingAnalysis(true);
    try {
      const result = await generateMatchAnalysis(prediction);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Could not load analysis.");
    } finally {
      setLoadingAnalysis(false);
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

  const renderStatusBadge = () => {
    if (prediction.result === PredictionResult.WON) {
      return (
        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded flex items-center border border-green-200">
          <CheckCircle2 size={14} className="mr-1" /> WON
        </span>
      );
    }
    if (prediction.result === PredictionResult.LOST) {
      return (
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded flex items-center border border-red-200">
          <XCircle size={14} className="mr-1" /> LOST
        </span>
      );
    }
    if (prediction.result === PredictionResult.VOID) {
      return (
        <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded flex items-center border border-gray-200">
          VOID
        </span>
      );
    }
    if (prediction.status === MatchStatus.LIVE) {
      return (
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded flex items-center animate-pulse border border-red-200">
          <span className="w-2 h-2 bg-red-600 rounded-full mr-1.5"></span> LIVE
        </span>
      );
    }
    if (prediction.status === MatchStatus.FINISHED) {
       return (
        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">
          Finished
        </span>
      );
    }
    
    // Default: Scheduled, show time
    return (
      <div className="flex items-center text-gray-500 text-sm font-medium bg-gray-50 px-2 py-1 rounded">
        <Clock size={14} className="mr-1" />
        {prediction.time}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
            {prediction.league}
          </span>
          {renderStatusBadge()}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="text-center w-1/3">
            <h3 className="font-bold text-gray-900 leading-tight">{prediction.homeTeam}</h3>
          </div>
          <div className="text-center w-1/3 px-2">
            <span className="text-xs text-gray-400 block mb-1">vs</span>
            <div className="text-sm font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 inline-block">
                {prediction.date.slice(5)}
            </div>
          </div>
          <div className="text-center w-1/3">
            <h3 className="font-bold text-gray-900 leading-tight">{prediction.awayTeam}</h3>
          </div>
        </div>

        <div className={`rounded-lg p-4 relative ${canView ? 'bg-green-50 border border-green-100' : 'bg-gray-900 text-white'}`}>
          {!canView && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm rounded-lg z-10 p-4 text-center">
              <Lock className="text-naija-green mb-2" size={24} />
              <p className="font-bold mb-1">{prediction.minTier} Access</p>
              <p className="text-xs text-gray-400 mb-3">Upgrade required to view</p>
              <button 
                onClick={onSubscribeClick}
                className="text-xs bg-naija-green text-white px-3 py-1.5 rounded-full hover:bg-green-600 transition"
              >
                Get {prediction.minTier} Plan
              </button>
            </div>
          )}
          
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-1">
                  <p className={`text-xs font-medium uppercase ${canView ? 'text-gray-500' : 'text-gray-400'}`}>
                    Prediction
                  </p>
                  {prediction.minTier !== SubscriptionTier.FREE && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTierBadgeColor(prediction.minTier)}`}>
                          {prediction.minTier}
                      </span>
                  )}
              </div>
              <p className={`text-lg font-bold ${canView ? 'text-gray-900' : 'text-white'}`}>
                {prediction.tip}
              </p>
            </div>
            <div className="text-right">
               <p className={`text-xs font-medium uppercase mb-1 ${canView ? 'text-gray-500' : 'text-gray-400'}`}>
                Odds
              </p>
              <span className="bg-white text-gray-900 font-bold px-2 py-1 rounded text-sm shadow-sm">
                {prediction.odds.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
           <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(prediction.confidence)}`}>
             {prediction.confidence}/10 Confidence
           </span>
           
           {canView && user?.subscription === SubscriptionTier.PREMIUM && (
             <button 
                onClick={handleAIAnalysis}
                disabled={loadingAnalysis}
                className="flex items-center text-xs text-naija-green font-medium hover:text-green-700 disabled:opacity-50"
             >
               <Zap size={14} className="mr-1" />
               {loadingAnalysis ? 'Analyzing...' : 'AI Analysis'}
             </button>
           )}
        </div>

        {analysis && canView && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700 leading-relaxed animate-fade-in">
                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-1">
                    <Zap size={12} className="text-naija-green fill-current"/> Gemini AI Insight
                </h4>
                {analysis}
            </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;