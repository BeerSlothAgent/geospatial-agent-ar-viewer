/**
 * Simulates blockchain payment processing for demo purposes
 */
export class BlockchainPaymentSimulator {
  /**
   * Simulates a blockchain payment process
   * @param amount Amount to pay
   * @param recipientAddress Recipient wallet address
   * @returns Promise that resolves with transaction hash
   */
  public static async simulatePayment(amount: number, recipientAddress: string): Promise<string> {
    console.log(`Simulating payment of ${amount} USDFC to ${recipientAddress}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a fake transaction hash
    const txHash = '0x' + Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log(`Payment simulation complete. Transaction hash: ${txHash}`);
    
    return txHash;
  }
  
  /**
   * Simulates checking transaction status
   * @param txHash Transaction hash to check
   * @returns Promise that resolves with transaction status
   */
  public static async checkTransactionStatus(txHash: string): Promise<'pending' | 'confirmed' | 'failed'> {
    console.log(`Checking status for transaction: ${txHash}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 80% chance of success for demo purposes
    const random = Math.random();
    let status: 'pending' | 'confirmed' | 'failed';
    
    if (random < 0.1) {
      status = 'pending';
    } else if (random < 0.9) {
      status = 'confirmed';
    } else {
      status = 'failed';
    }
    
    console.log(`Transaction status: ${status}`);
    return status;
  }
  
  /**
   * Simulates wallet connection
   * @returns Promise that resolves with wallet address
   */
  public static async connectWallet(): Promise<string> {
    console.log('Simulating wallet connection...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a fake wallet address
    const walletAddress = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log(`Wallet connected: ${walletAddress}`);
    return walletAddress;
  }
  
  /**
   * Simulates wallet balance check
   * @param walletAddress Wallet address to check
   * @returns Promise that resolves with balance
   */
  public static async checkBalance(walletAddress: string): Promise<number> {
    console.log(`Checking balance for wallet: ${walletAddress}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a random balance between 10 and 1000 USDFC
    const balance = Math.random() * 990 + 10;
    
    console.log(`Wallet balance: ${balance.toFixed(2)} USDFC`);
    return parseFloat(balance.toFixed(2));
  }
}