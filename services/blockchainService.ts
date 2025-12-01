import { Block, BlockData } from '../types';

// Simple SHA-256 implementation for browser compatibility
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export class BlockchainService {
  public chain: Block[];
  public difficulty: number;

  constructor() {
    this.chain = [];
    this.difficulty = 2; // Low difficulty for instant UI feedback
  }

  async createGenesisBlock(): Promise<Block> {
    const genesisBlock = await this.createBlock({
      voterId: "GENESIS",
      candidateId: "GENESIS",
      timestamp: Date.now()
    }, "0");
    this.chain.push(genesisBlock);
    return genesisBlock;
  }

  async createBlock(data: BlockData, previousHash: string): Promise<Block> {
    let nonce = 0;
    let hash = "";
    const index = this.chain.length;
    const timestamp = Date.now();

    // Simple Proof of Work simulation
    while (true) {
      const input = index + previousHash + timestamp + JSON.stringify(data) + nonce;
      hash = await sha256(input);
      if (hash.substring(0, this.difficulty) === Array(this.difficulty + 1).join("0")) {
        break;
      }
      nonce++;
    }

    return {
      index,
      timestamp,
      data,
      previousHash,
      hash,
      nonce
    };
  }

  async addVote(voterEmail: string, candidateId: string): Promise<Block> {
    const previousBlock = this.chain[this.chain.length - 1];
    
    // Anonymize voter
    const voterHash = await sha256(voterEmail); 

    const newBlock = await this.createBlock(
      { voterId: voterHash, candidateId, timestamp: Date.now() },
      previousBlock.hash
    );
    
    this.chain.push(newBlock);
    return newBlock;
  }

  async isChainValid(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      
      // Verify hash integrity (re-hash)
      const input = currentBlock.index + currentBlock.previousHash + currentBlock.timestamp + JSON.stringify(currentBlock.data) + currentBlock.nonce;
      const validHash = await sha256(input);
      
      if (validHash !== currentBlock.hash) {
        return false;
      }
    }
    return true;
  }

  hasVoted(voterHash: string): boolean {
    // Check all blocks except genesis
    return this.chain.slice(1).some(block => block.data.voterId === voterHash);
  }
}

export const blockchainInstance = new BlockchainService();