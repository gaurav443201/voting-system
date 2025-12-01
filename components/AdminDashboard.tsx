import React, { useState } from 'react';
import { Candidate, Block } from '../types';
import { generateManifesto } from '../services/geminiService';
import { Plus, Trash2, Power, PlayCircle, StopCircle, Sparkles, Share2, Check, Copy, ExternalLink } from 'lucide-react';

interface AdminDashboardProps {
  candidates: Candidate[];
  onAddCandidate: (c: Candidate) => void;
  onRemoveCandidate: (id: string) => void;
  votingActive: boolean;
  onToggleVoting: () => void;
  onLogout: () => void;
  chain: Block[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  candidates,
  onAddCandidate,
  onRemoveCandidate,
  votingActive,
  onToggleVoting,
  onLogout,
  chain
}) => {
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('CSE');
  const [loadingAi, setLoadingAi] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleAdd = async () => {
    if (!newName) return;
    
    setLoadingAi(true);
    const manifesto = await generateManifesto(newName, newDept);
    setLoadingAi(false);

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: newName,
      department: newDept,
      manifesto: manifesto,
      voteCount: 0
    };

    onAddCandidate(newCandidate);
    setNewName('');
  };

  const getCleanShareUrl = () => {
    // robustly get base URL without hash or search params that might cause 404s in some environments
    return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  };

  const handleShareLink = () => {
    const url = getCleanShareUrl();
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Election Control Center</h1>
            <p className="text-slate-400">Manage candidates and voting status</p>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Election Status</h2>
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-lg flex items-center justify-between ${votingActive ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                  <span className="font-medium">Status:</span>
                  <span className={`font-bold ${votingActive ? 'text-green-400' : 'text-red-400'}`}>
                    {votingActive ? 'LIVE' : 'ENDED'}
                  </span>
                </div>
                
                <button
                  onClick={onToggleVoting}
                  className={`w-full py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    votingActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20'
                  }`}
                >
                  {votingActive ? <><StopCircle /> End Election</> : <><PlayCircle /> Start Election</>}
                </button>

                <div className="border-t border-slate-700 my-2"></div>

                <div>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Voting Link</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      readOnly 
                      value={getCleanShareUrl()} 
                      className="bg-slate-900 border border-slate-600 text-slate-400 text-xs rounded px-2 py-2 flex-1"
                    />
                  </div>
                  <button
                    onClick={handleShareLink}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-indigo-300 hover:text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    {linkCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                    {linkCopied ? "Link Copied!" : "Copy Link"}
                  </button>
                </div>
                
                <p className="text-xs text-center text-slate-500">
                  Share this link with students. They will land on the login page.
                </p>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Add Candidate</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                     <option value="CSE">CSE</option>
                     <option value="IT">IT</option>
                     <option value="ENTC">ENTC</option>
                     <option value="MECH">MECH</option>
                     <option value="AIDS">AI & DS</option>
                  </select>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={loadingAi || votingActive}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {loadingAi ? (
                    <span className="animate-pulse">Generating Manifesto...</span>
                  ) : (
                    <><Plus className="w-5 h-5" /> Add Candidate</>
                  )}
                </button>
                {votingActive && <p className="text-xs text-yellow-500 text-center">Cannot add candidates while voting is live.</p>}
              </div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="text-sm uppercase text-slate-500 font-bold mb-2">Blockchain Stats</h3>
               <div className="text-slate-300 space-y-2 text-sm font-mono">
                  <p>Blocks Mined: <span className="text-indigo-400">{chain.length}</span></p>
                  <p>Difficulty: <span className="text-indigo-400">2</span></p>
                  <p>Protocol: <span className="text-indigo-400">PoW (Simulated)</span></p>
               </div>
            </div>
          </div>

          {/* Candidate List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-white">Registered Candidates</h2>
            <div className="grid gap-4">
              {candidates.length === 0 ? (
                <div className="text-center p-10 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl">
                  <p className="text-slate-500">No candidates added yet.</p>
                </div>
              ) : (
                candidates.map((c) => (
                  <div key={c.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-start hover:border-indigo-500/50 transition-colors">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{c.name}</h3>
                        <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded font-mono">{c.department}</span>
                      </div>
                      <div className="mt-2 flex items-start gap-2 text-slate-400 text-sm italic">
                         <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                         <p>"{c.manifesto}"</p>
                      </div>
                    </div>
                    {!votingActive && (
                      <button
                        onClick={() => onRemoveCandidate(c.id)}
                        className="text-slate-500 hover:text-red-400 p-2 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};