import React, { useState, useEffect } from 'react';
import { User, Candidate, Block, AppState, UserRole } from './types';
import { blockchainInstance } from './services/blockchainService';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { VotingBooth } from './components/VotingBooth';
import { Results } from './components/Results';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [chain, setChain] = useState<Block[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [votingActive, setVotingActive] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Initialize Blockchain
  useEffect(() => {
    const initChain = async () => {
      await blockchainInstance.createGenesisBlock();
      setChain([...blockchainInstance.chain]);
    };
    initChain();
  }, []);

  // Handle Login
  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === UserRole.ADMIN) {
      setAppState(AppState.ADMIN);
    } else {
      // Check if user has already voted by checking the chain for their hashed email
      // In a real app, verify hash consistency. Here we simulate.
      // We need to re-hash the email to check against the chain
      const emailHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(loggedInUser.email));
      const hashArray = Array.from(new Uint8Array(emailHashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const alreadyVoted = blockchainInstance.hasVoted(hashHex);
      setHasVoted(alreadyVoted);

      if (!votingActive && !alreadyVoted) {
          // If voting closed and user hasn't voted, they might just see results if allowed, 
          // or a "closed" screen. 
          // For this app logic: If closed, show Results/End Screen.
          setAppState(AppState.RESULTS);
      } else {
          setAppState(AppState.VOTING);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAppState(AppState.LOGIN);
    setHasVoted(false);
  };

  // Admin Actions
  const handleAddCandidate = (candidate: Candidate) => {
    setCandidates([...candidates, candidate]);
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
  };

  const toggleVoting = () => {
    setVotingActive(!votingActive);
  };

  // Voting Action
  const handleVote = async (candidateId: string) => {
    if (!user || !user.email) return;

    // 1. Add block to chain
    await blockchainInstance.addVote(user.email, candidateId);
    
    // 2. Update local chain state
    setChain([...blockchainInstance.chain]);

    // 3. Update candidate count (Visualization only, truth is in chain)
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
    ));

    setHasVoted(true);
  };

  // Render Logic
  const renderContent = () => {
    switch (appState) {
      case AppState.LOGIN:
        return <Login onLogin={handleLogin} />;
      
      case AppState.ADMIN:
        return (
          <AdminDashboard
            candidates={candidates}
            onAddCandidate={handleAddCandidate}
            onRemoveCandidate={handleRemoveCandidate}
            votingActive={votingActive}
            onToggleVoting={toggleVoting}
            onLogout={handleLogout}
            chain={chain}
          />
        );

      case AppState.VOTING:
        // If voting is stopped and user is logged in as voter, show results
        if (!votingActive && !hasVoted) {
            return <VotingBooth 
                user={user!} 
                candidates={candidates} 
                onVote={handleVote} 
                hasVoted={hasVoted} 
                onLogout={handleLogout}
                electionEnded={true}
            />;
        }
        // If user already voted, stay on booth to show success message, 
        // or redirect to results if election is over. 
        if (hasVoted && !votingActive) {
            return <Results candidates={candidates} chain={chain} onLogout={handleLogout} />;
        }
        
        return (
          <VotingBooth
            user={user!}
            candidates={candidates}
            onVote={handleVote}
            hasVoted={hasVoted}
            onLogout={handleLogout}
            electionEnded={!votingActive && !hasVoted}
          />
        );

      case AppState.RESULTS:
        return <Results candidates={candidates} chain={chain} onLogout={handleLogout} />;

      default:
        return <div className="text-white">Unknown State</div>;
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      {renderContent()}
    </div>
  );
};

export default App;