// app/types/transaction.ts
export interface Transaction {
  id: string; // Full transaction ID
  timestamp: number;
  time: string;
  tokenName: string;
  tokenTicker: string;
  tokenAmount: string;
  solAmount: string;
  wallet: string;
  type: string;
  signature: string; // Short signature for display
  fee: string;
  blockHeight: string;
  fullWalletAddress?: string; // Optional: store full wallet address for copying
}