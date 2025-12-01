import { Block, BlockData } from '../types';

// Client-side helper class. 
// Note: The actual "Source of Truth" is now the Server's chain.
// This class can be used to locally verify the chain integrity if needed.

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export class BlockchainService {
  public chain: Block[];

  constructor() {
    this.chain = [];
  }

  // Purely for client-side verification of the data fetched from server
  async isChainValid(serverChain: Block[]): Promise<boolean> {
    for (let i = 1; i < serverChain.length; i++) {
      const currentBlock = serverChain[i];
      const previousBlock = serverChain[i - 1];

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
}

export const blockchainInstance = new BlockchainService();