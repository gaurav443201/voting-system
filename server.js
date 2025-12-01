import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the build directory
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
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

// Genesis Block - Init Immediately
chain.push(createBlock({ voterId: "GENESIS", candidateId: "GENESIS" }, "0"));
console.log("Blockchain initialized with Genesis Block");

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

    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    // If Credentials exist, try to send real email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            await transporter.sendMail({
                from: '"VIT ChainVote Admin" <navgharegaurav80@gmail.com>', // Explicitly set the sender
                to: email,
                subject: 'VIT ChainVote Verification Code',
                text: `Your OTP for VIT ChainVote is: ${otp}\n\nThis code is valid for 5 minutes.`
            });
            console.log(`[AUTH] Email sent successfully to ${email} from navgharegaurav80@gmail.com`);
            res.json({ success: true, message: "OTP sent to email" });
        } catch (error) {
            console.error("[AUTH] Failed to send email via SMTP:", error);
            // Fallback: Don't block the user, just log it so admin can debug, and let user use the logged OTP
            res.json({ 
                success: true, 
                message: "OTP Generated but Email failed (Check Logs)", 
                warning: "Email sending failed. OTP logged in server console for testing." 
            });
        }
    } else {
        console.log("[AUTH] EMAIL_USER/PASS not set in environment. OTP logged to console only.");
        res.json({ 
            success: true, 
            message: "OTP generated (Dev Mode)", 
            warning: "Email not configured. Check Server Logs for OTP." 
        });
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
    console.log(`[ADMIN] Voting toggled: ${votingActive}`);
    res.json({ success: true, votingActive });
});

// 5. Admin: Add Candidate
app.post('/api/admin/candidate', (req, res) => {
    console.log("[ADMIN] Received Add Candidate Request");
    const candidate = req.body;
    
    if (!candidate || !candidate.id) {
        return res.status(400).json({ error: "Invalid candidate data" });
    }
    
    candidates.push({ ...candidate, voteCount: 0 });
    console.log(`[ADMIN] Candidate Added: ${candidate.name}. Total Candidates: ${candidates.length}`);
    
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
    
    console.log(`[VOTE] Vote cast for candidate ${candidateId}`);

    res.json({ success: true, block: newBlock });
});

// --- Catch API Errors ---
// Important: If an API route is missing, return JSON 404, not HTML
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: "API Endpoint not found" });
});

// Fallback for SPA routing
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Helpful error for deployment issues
        res.status(404).send(`
            <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #333;">
                <h1 style="color: #e11d48;">Frontend Build Not Found</h1>
                <p>The server cannot find the <code>dist/index.html</code> file.</p>
                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block; text-align: left;">
                    <strong>Possible Fixes for Render:</strong>
                    <ol>
                        <li>Ensure "Build Command" is: <code>npm install && npm run build</code></li>
                        <li>Ensure "Start Command" is: <code>npm start</code></li>
                        <li>Check "Logs" for build errors.</li>
                    </ol>
                </div>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    
    // Diagnostic check on startup
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
        console.warn("⚠️  WARNING: 'dist/index.html' not found. The frontend will not load.");
        console.warn("   Make sure to run 'npm run build' before starting the server.");
    } else {
        console.log("✅ Frontend build detected.");
    }
});