export enum UserRole {
  ADMIN = 'ADMIN',
  VOTER = 'VOTER',
  GUEST = 'GUEST'
}

export interface User {
  email: string;
  role: UserRole;
  name?: string;
  prn?: string;
  department?: string;
  isVerified: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  department: string;
  manifesto: string;
  voteCount: number;
}

export interface BlockData {
  voterId: string; // Hashed/Anonymized
  candidateId: string;
  timestamp: number;
}

export interface Block {
  index: number;
  timestamp: number;
  data: BlockData;
  previousHash: string;
  hash: string;
  nonce: number;
}

export enum AppState {
  LOGIN = 'LOGIN',
  VOTING = 'VOTING',
  RESULTS = 'RESULTS',
  ADMIN = 'ADMIN'
}

export const ADMIN_EMAILS = [
  'shadow70956@gmail.com',
  'navgharegaurav80@gmail.com'
];