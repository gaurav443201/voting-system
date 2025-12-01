import React, { useEffect, useState, useMemo } from 'react';
import { Candidate, Block } from '../types';
import { analyzeResults } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Bot, Link, Hash } from 'lucide-react';

interface ResultsProps {
  candidates: Candidate[];
  chain: Block[];
  onLogout: () => void;
}

export const Results: React.FC<ResultsProps> = ({ candidates, chain, onLogout }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Calculate winner
  const winner = useMemo(() => {
    if (candidates.length === 0) return null;
    return candidates.reduce((prev, current) => (prev.voteCount > current.voteCount) ? prev : current);
  }, [candidates]);

  // Trigger AI analysis on mount
  useEffect(() => {
    // Only analyze if there are actual votes (chain length > 1 for genesis)
    if (winner && chain.length > 1) {
      setLoadingAnalysis(true);
      analyzeResults(candidates, chain, winner)
        .then(setAnalysis)
        .finally(() => setLoadingAnalysis(false));
    }
  }, [winner, candidates, chain]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Election Results</h1>
                <p className="text-slate-400">Blockchain Verified Count</p>
            </div>
            <button onClick={onLogout} className="px-4 py-2 text-slate-400 hover:text-white">Exit</button>
        </header>

        {/* Winner & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="md:col-span-1 bg-gradient-to-br from-yellow-900/40 to-yellow-600/10 border border-yellow-700/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Trophy className="w-24 h-24 text-yellow-500" />
                </div>
                {winner ? (
                    <>
                        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/50">
                            <Trophy className="w-10 h-10 text-slate-900" />
                        </div>
                        <h2 className="text-yellow-500 font-bold tracking-wider text-sm uppercase mb-1">Projected Winner</h2>
                        <h3 className="text-3xl font-bold text-white mb-1">{winner.name}</h3>
                        <p className="text-yellow-200/80">{winner.department} Representative</p>
                        <div className="mt-6 bg-slate-900/50 px-4 py-2 rounded-full border border-yellow-700/50">
                            <span className="text-2xl font-bold text-white">{winner.voteCount}</span> <span className="text-sm text-slate-400">Votes</span>
                        </div>
                    </>
                ) : (
                    <p className="text-slate-400">No votes cast yet.</p>
                )}
            </div>

            <div className="md:col-span-2 space-y-6">
                {/* AI Analysis */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-6 h-6 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-white">AI Election Insight</h3>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 min-h-[100px]">
                        {loadingAnalysis ? (
                            <div className="flex items-center gap-2 text-slate-500 animate-pulse">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                Analyzing blockchain data...
                            </div>
                        ) : (
                            <p className="text-slate-300 leading-relaxed">{analysis || "Insufficient data for analysis."}</p>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                         <p className="text-slate-500 text-xs uppercase font-bold">Total Votes</p>
                         <p className="text-2xl font-bold text-white mt-1">
                           {/* Ensure non-negative display */}
                           {Math.max(0, chain.length - 1)}
                         </p>
                     </div>
                     <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                         <p className="text-slate-500 text-xs uppercase font-bold">Chain Height</p>
                         <p className="text-2xl font-bold text-indigo-400 mt-1">{chain.length}</p>
                     </div>
                </div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-12">
            <h3 className="text-xl font-semibold text-white mb-6">Vote Distribution</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={candidates}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                        />
                        <Bar dataKey="voteCount" radius={[4, 4, 0, 0]}>
                            {candidates.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Blockchain Visualizer */}
        <div className="border-t border-slate-700 pt-10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Link className="w-5 h-5 text-indigo-400" />
                Live Blockchain Ledger
            </h3>
            <div className="space-y-4">
                {chain.slice().reverse().map((block) => (
                    <div key={block.hash} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg font-mono text-sm hover:border-indigo-500/50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-indigo-300">
                                    <Hash className="w-4 h-4" />
                                    <span>Block #{block.index}</span>
                                </div>
                                <p className="text-slate-500 text-xs">Timestamp: {new Date(block.timestamp).toLocaleTimeString()}</p>
                            </div>
                            <div className="flex-1 md:mx-8 space-y-1">
                                <div className="flex gap-2">
                                    <span className="text-slate-500 w-24">Prev Hash:</span>
                                    <span className="text-slate-400 truncate w-full md:w-auto block">{block.previousHash.substring(0, 20)}...</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-slate-500 w-24">Curr Hash:</span>
                                    <span className="text-green-500/80 truncate w-full md:w-auto block">{block.hash}</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-slate-800 text-xs text-slate-400">
                                {block.index === 0 ? "GENESIS BLOCK" : `Vote for: ${candidates.find(c => c.id === block.data.candidateId)?.name || 'Unknown'}`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};