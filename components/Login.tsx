import React, { useState } from 'react';
import { User, UserRole, ADMIN_EMAILS } from '../types';
import { Mail, ShieldCheck, Lock, ArrowRight, Building, CheckCircle, X } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

// Regex format: name.prn@vit.edu (e.g., student.123456@vit.edu)
// Strictly enforces: letters + dot + numbers + @vit.edu
const STUDENT_EMAIL_REGEX = /^[a-zA-Z]+\.[0-9]+@vit\.edu$/;

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [selectedDept, setSelectedDept] = useState('CSE');
  
  // New state for on-screen OTP notification
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  const handleSendOtp = () => {
    setError('');
    setShowOtpNotification(false);
    
    const lowerEmail = email.toLowerCase().trim();

    // Check for Admin
    if (ADMIN_EMAILS.includes(lowerEmail)) {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setStep('OTP');
      setShowOtpNotification(true); // Show OTP on screen
      return;
    }

    // Check for Student (Strict Format)
    if (STUDENT_EMAIL_REGEX.test(lowerEmail)) {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      setStep('OTP');
      setShowOtpNotification(true); // Show OTP on screen
      return;
    }

    setError('Invalid Email. Format must be: name.prn@vit.edu (e.g., student.123456@vit.edu)');
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      const lowerEmail = email.toLowerCase().trim();
      const isAdmin = ADMIN_EMAILS.includes(lowerEmail);
      
      let userData: User = {
        email: lowerEmail,
        role: isAdmin ? UserRole.ADMIN : UserRole.VOTER,
        isVerified: true,
        department: selectedDept
      };

      if (!isAdmin) {
        // Extract name and PRN from email
        const [localPart] = lowerEmail.split('@');
        const [name, prn] = localPart.split('.');
        userData = { ...userData, name, prn };
      }

      onLogin(userData);
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      {/* Global OTP Notification - Fixed position ensures visibility */}
      {showOtpNotification && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 p-4 text-white shadow-2xl z-[100] animate-in slide-in-from-top-full duration-300">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="bg-white/20 p-2 rounded-full">
                  <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide opacity-90">Simulation OTP</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold">{generatedOtp}</span>
                  <span className="text-xs opacity-75">(Backend not connected)</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowOtpNotification(false)} 
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 relative z-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center pt-10">
          <ShieldCheck className="w-12 h-12 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">VIT ChainVote</h1>
          <p className="text-blue-100 text-sm">Blockchain Secured Voting System</p>
        </div>

        <div className="p-8">
          {step === 'EMAIL' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your college email"
                    className="w-full bg-slate-700 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-500 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Format: <span className="font-mono text-indigo-400">name.prn@vit.edu</span>
                </p>
              </div>

              {!ADMIN_EMAILS.includes(email.toLowerCase()) && (
                 <div>
                 <label className="block text-slate-400 text-sm font-medium mb-1">Select Department</label>
                 <div className="relative">
                   <Building className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                   <select 
                     value={selectedDept}
                     onChange={(e) => setSelectedDept(e.target.value)}
                     className="w-full bg-slate-700 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none cursor-pointer"
                   >
                     <option value="CSE">CSE (Computer Science)</option>
                     <option value="IT">IT (Information Tech)</option>
                     <option value="ENTC">ENTC (Electronics)</option>
                     <option value="MECH">MECH (Mechanical)</option>
                     <option value="AIDS">AI & DS</option>
                   </select>
                 </div>
               </div>
              )}

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2">
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-slate-300">Enter OTP sent to</p>
                <p className="text-blue-400 font-mono text-sm break-all">{email}</p>
              </div>

              <div>
                <label className="block text-slate-400 text-sm font-medium mb-1">One Time Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="XXXXXX"
                    className="w-full bg-slate-700 border border-slate-600 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none tracking-widest font-mono text-center text-xl"
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2">
                   <X className="w-4 h-4 text-red-500" />
                   <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-green-900/20"
              >
                Verify & Login
              </button>
              
              <button 
                onClick={() => {
                  setStep('EMAIL');
                  setOtp('');
                  setError('');
                  setShowOtpNotification(false);
                }}
                className="w-full text-slate-400 hover:text-white text-sm py-2"
              >
                Back to Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};