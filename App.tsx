import React, { useState, useEffect } from 'react';
import { User, Candidate, Block, AppState, UserRole } from './types';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { VotingBooth } from './components/VotingBooth';
import { Results } from './components/Results';
import { Loader2 } from 'lucide-react';

// Helper to hash email client-side for "hasVoted" check (UI only)
async function hashEmail(email: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [chain, setChain] = useState<Block[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [votingActive, setVotingActive] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- POLLING: Fetch State from Server ---
  const fetchState = async () => {
    try {
      // Add timestamp to prevent caching: ?t=12345678
      const res = await fetch(`/api/state?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates);
        setChain(data.chain);
        setVotingActive(data.votingActive);
        
        // If user is logged in, check if they are in the updated chain
        if (user && user.role !== UserRole.ADMIN) {
           const myHash = await hashEmail(user.email);
           const voted = data.chain.slice(1).some((b: Block) => b.data.voterId === myHash);
           setHasVoted(voted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch state", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and Polling interval
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [user]); // Re-run polling logic check if user changes

  // Handle Login Logic
  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === UserRole.ADMIN) {
      setAppState(AppState.ADMIN);
    } else {
      // Logic to determine initial screen based on server state
      if (loggedInUser.role === UserRole.VOTER) {
          const myHash = await hashEmail(loggedInUser.email);
          const voted = chain.slice(1).some((b: Block) => b.data.voterId === myHash);
          setHasVoted(voted);
          
          if (voted) {
             // If already voted, show results/thanks depending on state
             setAppState(AppState.VOTING); // VotingBooth handles "Already Voted" UI
          } else if (!votingActive) {
             // Election not started or ended
             setAppState(AppState.RESULTS);
          } else {
             setAppState(AppState.VOTING);
          }
      }
    }
  };

  // Effect to handle State Transitions based on Server Data
  useEffect(() => {
     if (!user) return;
     
     if (user.role === UserRole.VOTER) {
        if (hasVoted) {
           // Stay on Voting Booth (it shows receipt) or Results
           if (!votingActive) setAppState(AppState.RESULTS);
           else setAppState(AppState.VOTING);
        } else {
           if (votingActive) setAppState(AppState.VOTING);
           else setAppState(AppState.RESULTS); // or a "Waiting for start" screen
        }
     }
  }, [votingActive, hasVoted, user]);


  const handleLogout = () => {
    setUser(null);
    setAppState(AppState.LOGIN);
    setHasVoted(false);
  };

  // --- Server Actions ---

  const handleAddCandidate = async (candidate: Candidate) => {
    try {
      const res = await fetch('/api/admin/candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(candidate)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server Error: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates); // Immediate UI update from response
        alert("Candidate added successfully!"); 
        // Force a re-fetch to ensure sync
        fetchState();
      } else {
        alert("Failed to add candidate: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      console.error("Add candidate failed", e);
      alert("Error connecting to server: " + e.message);
    }
  };

  const handleRemoveCandidate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/candidate/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates); // Immediate UI update from response
      }
    } catch (e) {
      console.error("Remove candidate failed", e);
    }
  };

  const toggleVoting = async () => {
    await fetch('/api/admin/toggle', { method: 'POST' });
    fetchState();
  };

  const handleVote = async (candidateId: string) => {
    if (!user || !user.email) return;

    const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, candidateId })
    });

    if (res.ok) {
        setHasVoted(true);
        fetchState();
    } else {
        alert("Voting failed or you have already voted.");
    }
  };

  // Render Logic
  const renderContent = () => {
    if (isLoading && !user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Connecting to Secure Server...</h2>
                <p className="text-slate-400 text-sm max-w-md">
                    If this takes longer than 10 seconds, the server might be waking up (Render Free Tier). 
                    Please wait up to 1 minute.
                </p>
            </div>
        );
    }

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
        // Even if AppState is VOTING, if election stopped and user hasn't voted, show wait/results
        if (!votingActive && !hasVoted) {
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