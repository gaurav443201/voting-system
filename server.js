import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Add this in Render Environment Variables
        pass: process.env.EMAIL_PASS  // Add this in Render Environment Variables (App Password)
    }
});

// --- In-Memory State ---
let chain = [];
let candidates = [];
let votingActive = false;
const otpStore = new Map(); // Stores { email: { otp, expires } }

// Helper: SHA-256
function sha256(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

// Helper: Create Block
function createBlock(data, previousHash) {
    const index = chain.length;
    const timestamp = Date.now();
    let nonce = 0;
    let hash = "";
    const difficulty = 2; 

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

// Genesis Block
chain.push(createBlock({ voterId: "GENESIS", candidateId: "GENESIS" }, "0"));

// --- API Routes ---

// 1. Get State
app.get('/api/state', (req, res) => {
    res.json({ candidates, chain, votingActive });
});

// 2. Auth: Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory (expires in 5 mins)
    otpStore.set(email, { 
        otp, 
        expires: Date.now() + 5 * 60 * 1000 
    });

    console.log(`Generating OTP for ${email}: ${otp}`);

    // If Credentials exist, send real email. Otherwise log it.
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'VIT ChainVote Verification Code',
                text: `Your OTP for VIT ChainVote is: ${otp}\n\nThis code is valid for 5 minutes.`
            });
            console.log(`Email sent to ${email}`);
            res.json({ success: true, message: "OTP sent to email" });
        } catch (error) {
            console.error("Failed to send email:", error);
            res.status(500).json({ error: "Failed to send email. Please check server logs." });
        }
    } else {
        console.log("WARNING: EMAIL_USER/PASS not set. OTP logged to console only.");
        // We still return success so the app works for testing without config
        res.json({ success: true, message: "OTP generated (Check Server Logs - Email Config Missing)" });
    }
});

// 3. Auth: Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore.get(email);

    if (!record) {
        return res.status(400).json({ error: "No OTP requested for this email" });
    }

    if (Date.now() > record.expires) {
        otpStore.delete(email);
        return res.status(400).json({ error: "OTP expired. Please request a new one." });
    }

    if (record.otp === otp) {
        otpStore.delete(email); // Invalidate after use
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Invalid OTP" });
    }
});

// 4. Admin: Toggle Voting
app.post('/api/admin/toggle', (req, res) => {
    votingActive = !votingActive;
    console.log(`Voting toggled: ${votingActive}`);
    res.json({ success: true, votingActive });
});

// 5. Admin: Add Candidate
app.post('/api/admin/candidate', (req, res) => {
    console.log("Received Add Candidate Request");
    const candidate = req.body;
    
    if (!candidate || !candidate.id) {
        return res.status(400).json({ error: "Invalid candidate data" });
    }
    
    // Add to memory
    candidates.push({ ...candidate, voteCount: 0 });
    console.log(`Candidate Added: ${candidate.name}. Total: ${candidates.length}`);
    
    // Return updated list immediately
    res.json({ success: true, candidates });
});

// 6. Admin: Remove Candidate
app.delete('/api/admin/candidate/:id', (req, res) => {
    const { id } = req.params;
    candidates = candidates.filter(c => c.id !== id);
    res.json({ success: true, candidates });
});

// 7. Voter: Cast Vote
app.post('/api/vote', (req, res) => {
    if (!votingActive) {
        return res.status(400).json({ error: "Voting is closed." });
    }

    const { email, candidateId } = req.body;
    const voterHash = sha256(email.toLowerCase().trim());
    const hasVoted = chain.slice(1).some(block => block.data.voterId === voterHash);
    
    if (hasVoted) {
        return res.status(400).json({ error: "You have already voted." });
    }

    const previousBlock = chain[chain.length - 1];
    const newBlock = createBlock(
        { voterId: voterHash, candidateId, timestamp: Date.now() },
        previousBlock.hash
    );
    chain.push(newBlock);

    candidates = candidates.map(c => 
        c.id === candidateId ? { ...c, voteCount: c.voteCount + 1 } : c
    );

    res.json({ success: true, block: newBlock });
});

// Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});