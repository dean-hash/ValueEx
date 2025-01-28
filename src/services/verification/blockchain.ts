import { ethers } from 'ethers';
import { logger } from '../../utils/logger';

interface Transaction {
  amount: number;
  timestamp: Date;
  source: string;
  transactionId: string;
}

interface VerificationResult {
  blockchainTxId: string;
  timestamp: number;
  verified: boolean;
}

export class BlockchainVerifier {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  
  constructor() {
    // Connect to Ethereum network
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id'
    );
    
    // Smart contract for revenue verification
    this.contract = new ethers.Contract(
      process.env.VERIFICATION_CONTRACT_ADDRESS || '',
      [
        'function verifyTransaction(string source, string txId, uint256 amount, uint256 timestamp) public returns (bytes32)',
        'function getVerification(bytes32 id) public view returns (bool verified, uint256 timestamp)',
        'function recordIncome(uint256 amount, string source, bytes32 txId) public'
      ],
      this.provider
    );
  }

  async verifyTransaction(tx: Transaction): Promise<string> {
    try {
      // Submit transaction to blockchain
      const result = await this.contract.verifyTransaction(
        tx.source,
        tx.transactionId,
        ethers.utils.parseEther(tx.amount.toString()),
        Math.floor(tx.timestamp.getTime() / 1000)
      );

      // Wait for confirmation
      const receipt = await result.wait();
      
      logger.info(`Transaction verified on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      logger.error('Error verifying transaction on blockchain:', error);
      throw error;
    }
  }

  async recordIncome(income: any): Promise<void> {
    try {
      const result = await this.contract.recordIncome(
        ethers.utils.parseEther(income.amount.toString()),
        income.source,
        ethers.utils.id(income.verification.awinTransactionId || '')
      );

      await result.wait();
      
      logger.info(`Income recorded on blockchain: ${result.hash}`);
    } catch (error) {
      logger.error('Error recording income on blockchain:', error);
      throw error;
    }
  }

  async getVerification(blockchainTxId: string): Promise<VerificationResult> {
    const [verified, timestamp] = await this.contract.getVerification(blockchainTxId);
    
    return {
      blockchainTxId,
      timestamp: timestamp.toNumber() * 1000, // Convert to milliseconds
      verified
    };
  }
}
