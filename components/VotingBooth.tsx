import React, { useState } from 'react';
import { Candidate, User } from '../types';
import { Vote, CheckCircle2, AlertTriangle } from 'lucide-react';

interface VotingBoothProps {
  user: User;
  candidates: Candidate[];
  onVote: (candidateId: string) => Promise<void>;
  hasVoted: boolean;
  onLogout: () => void;
  electionEnded: boolean;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  user,
  candidates,
  onVote,
  hasVoted,
  onLogout,
  electionEnded
}) => {
  const [votingFor, setVotingFor] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter candidates by user department
  const deptCandidates = candidates.filter(c => c.department === user.department);

  const handleVote = async (candidateId: string) => {
    setIsProcessing(true);
    await onVote(candidateId);
    setIsProcessing(false);
  };

  if (electionEnded) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
              <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full text-center border border-slate-700">
                  <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Election Ended</h2>
                  <p className="text-slate-400 mb-6">Voting is currently closed. Please wait for the results to be published.</p>
                  <button onClick={onLogout} className="text-blue-400 hover:underline">Return to Login</button>
              </div>
          </div>
      )
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full text-center border border-green-900 shadow-2xl shadow-green-900/10">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Vote Recorded on Blockchain</h2>
          <p className="text-slate-400 mb-6">
            Your vote has been hashed and added to the block successfully. Thank you for participating in the VIT Student Council Election.
          </p>
          <div className="bg-slate-900 p-4 rounded-lg text-left mb-6">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Voter ID Hash (Anonymized)</p>
            <p className="font-mono text-xs text-green-400 break-all">
                {/* Simulated hash for visual confirmation */}
                7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
            </p>
          </div>
          <button onClick={onLogout} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 max-w-6xl mx-auto border-b border-slate-700 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Ballot</h1>
          <p className="text-slate-400 text-sm">Welcome, {user.name} ({user.department})</p>
        </div>
        <div className="mt-4 md:mt-0">
             <button onClick={onLogout} className="text-sm text-slate-500 hover:text-white transition-colors">Cancel & Logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl text-white mb-6 font-semibold flex items-center gap-2">
            Candidates for <span className="text-indigo-400">{user.department}</span> CR
        </h2>

        {deptCandidates.length === 0 ? (
           <div className="text-center py-20 bg-slate-800/50 rounded-xl">
             <p className="text-slate-500 text-lg">No candidates registered for your department yet.</p>
           </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptCandidates.map((candidate) => (
                <div 
                key={candidate.id}
                className={`bg-slate-800 rounded-xl border-2 transition-all duration-300 overflow-hidden group ${
                    votingFor === candidate.id ? 'border-indigo-500 scale-[1.02] shadow-xl shadow-indigo-900/20' : 'border-slate-700 hover:border-slate-600'
                }`}
                >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {candidate.name.charAt(0)}
                        </div>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">PRN: {candidate.id.slice(-4)}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1">{candidate.name}</h3>
                    <p className="text-indigo-400 text-sm font-medium mb-4">{candidate.department} Department</p>
                    
                    <div className="bg-slate-900/50 p-3 rounded-lg mb-6">
                        <p className="text-slate-400 text-sm italic">"{candidate.manifesto}"</p>
                    </div>

                    <button
                        onClick={() => votingFor === candidate.id ? handleVote(candidate.id) : setVotingFor(candidate.id)}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                            votingFor === candidate.id 
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                    >
                        {isProcessing && votingFor === candidate.id ? (
                            <span className="animate-pulse">Hashing Block...</span>
                        ) : (
                            votingFor === candidate.id ? 'Confirm Vote' : 'Select Candidate'
                        )}
                        {!isProcessing && <Vote className="w-4 h-4" />}
                    </button>
                    {votingFor === candidate.id && !isProcessing && (
                         <p className="text-center text-xs text-indigo-300 mt-2">Click again to confirm</p>
                    )}
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};