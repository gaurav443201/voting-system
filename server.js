import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- In-Memory Blockchain & State ---
// In a real production app, this would be in a database/persistent storage.
let chain = [];
let candidates = [];
let votingActive = false;

// Helper: SHA-256
function sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// Helper: Create Block (Synchronous for simplicity in this demo)
function createBlock(data, previousHash) {
    const index = chain.length;
    const timestamp = Date.now();
    let nonce = 0;
    let hash = "";
    const difficulty = 2; // Low difficulty for instant mining in demo

    // Proof of Work
    while (true) {
        const input = index + previousHash + timestamp + JSON.stringify(data) + nonce;
        hash = sha256(input);
        if (hash.substring(0, difficulty) === Array(difficulty + 1).join("0")) {
            break;
        }
        nonce++;
    }

    return { index, timestamp, data, previousHash, hash, nonce };
}

// Initialize Genesis Block Immediately (Synchronously)
// This prevents the "Total Votes: -1" issue by ensuring chain is never empty.
chain.push(createBlock({ voterId: "GENESIS", candidateId: "GENESIS" }, "0"));

// --- API Routes ---

// Get full state (polling endpoint)
app.get('/api/state', (req, res) => {
    res.json({
        candidates,
        chain,
        votingActive
    });
});

// Admin: Toggle Voting
app.post('/api/admin/toggle', (req, res) => {
    votingActive = !votingActive;
    res.json({ success: true, votingActive });
});

// Admin: Add Candidate
app.post('/api/admin/candidate', (req, res) => {
    const candidate = req.body;
    // Basic validation
    if (!candidate || !candidate.id) {
        return res.status(400).json({ error: "Invalid candidate data" });
    }
    candidates.push({ ...candidate, voteCount: 0 });
    res.json({ success: true, candidates });
});

// Admin: Remove Candidate
app.delete('/api/admin/candidate/:id', (req, res) => {
    const { id } = req.params;
    candidates = candidates.filter(c => c.id !== id);
    res.json({ success: true, candidates });
});

// Voter: Cast Vote
app.post('/api/vote', (req, res) => {
    if (!votingActive) {
        return res.status(400).json({ error: "Voting is closed." });
    }

    const { email, candidateId } = req.body;
    
    // Anonymize email (Hash it)
    const voterHash = sha256(email.toLowerCase().trim());

    // Check double voting (Skip genesis block)
    const hasVoted = chain.slice(1).some(block => block.data.voterId === voterHash);
    if (hasVoted) {
        return res.status(400).json({ error: "You have already voted." });
    }

    // Add to Blockchain
    const previousBlock = chain[chain.length - 1];
    const newBlock = createBlock(
        { voterId: voterHash, candidateId, timestamp: Date.now() },
        previousBlock.hash
    );
    chain.push(newBlock);

    // Update Candidate Count
    candidates = candidates.map(c => 
        c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
    );

    res.json({ success: true, block: newBlock });
});

// Fallback for SPA (Single Page App) routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});