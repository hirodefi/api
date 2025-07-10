// app/lib/helius-websocket.ts (Cleaned - No Static Values)
import type { Transaction } from '../types/transaction';

const WALLETS = [
  'DbTVH1pNaSTLfWn62y4WUW1mNsaAk6U7L4Jp3aDrwi3x',
  '2ynqgvWMCrqoLBaubx3rMfh1tV1BhHxyw5EehGW1wob7',
  '9yYya3F5EJoLnBNKW6z4bZvyQytMXzDcpU5D6yYr4jqL',
  '96sErVjEN7LNJ6Uvj63bdRWZxNuBngj56fnT9biHLKBf',
  'BuhkHhM3j4viF71pMTd23ywxPhF35LUnc2QCLAvUxCdW',
  'ApRnQN2HkbCn7W2WWiT2FEKvuKJp9LugRyAE1a9Hdz1',
  'FAicXNV5FVqtfbpn4Zccs71XcfGeyxBSGbqLDyDJZjke',
  'CA4keXLtGJWBcsWivjtMFBghQ8pFsGRWFxLrRCtirzu5',
  'UxuuMeyX2pZPHmGZ2w3Q8MysvExCAquMtvEfqp2etvm',
  'AeLaMjzxErZt4drbWVWvcxpVyo8p94xu5vrg41eZPFe3',
  '4BdKaxN8G6ka4GYtQQWk4G4dZRUTX2vQH9GcXdBREFUk',
  '86AEJExyjeNNgcp7GrAvCXTDicf5aGWgoERbXFiG1EdD',
  '8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6',
  '3pZ59YENxDAcjaKa3sahZJBcgER4rGYi4v6BpPurmsGj',
  'GJA1HEbxGnqBhBifH9uQauzXSB53to5rhDrzmKxhSU65',
  'BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd',
  '8MaVa9kdt3NW4Q5HyNAm1X5LbR8PQRVDc1W8NMVK88D5',
  'DZAa55HwXgv5hStwaTEJGXZz1DhHejvpb7Yr762urXam',
  'BaLxyjXzATAnfm7cc5AFhWBpiwnsb71THcnofDLTWAPK',
  'As7HjL7dzzvbRbaD3WCun47robib2kmAKRXMvjHkSMB5',
  'EKDDjxzJ39Bjkr47NiARGJDKFVxiiV9WNJ5XbtEhPEXP',
  '831yhv67QpKqLBJjbmw2xoDUeeFHGUx8RnuRj9imeoEs',
  '5B79fMkcFeRTiwm7ehsZsFiKsC7m7n1Bgv9yLxPp9q2X',
  'DYmsQudNqJyyDvq86XmzAvrU9T7xwfQEwh6gPQw9TPNF',
  'BtMBMPkoNbnLF9Xn552guQq528KKXcsNBNNBre3oaQtr',
  '3BLjRcxWGtR7WRshJ3hL25U3RjWr5Ud98wMcczQqk4Ei',
  'CvNiezB8hofusHCKqu8irJ6t2FKY7VjzpSckofMzk5mB',
  '9jyqFiLnruggwNn4EQwBNFXwpbLM9hrA4hV59ytyAVVz',
  '5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG',
  '2iJNcbQ7hjwLzcRqoo37xYaTPCRMHzfcdeUmNZHbFs55',
  'G3g1CKqKWSVEVURZDNMazDBv7YAhMNTjhJBVRTiKZygk'
];

interface TokenMetadata {
  name: string;
  symbol: string;
  uri?: string;
  decimals?: number;
  isNFT?: boolean;
  logoURI?: string;
}

// Dynamic token metadata cache
const tokenMetadataCache = new Map<string, TokenMetadata>();
const pendingRequests = new Map<string, Promise<TokenMetadata | null>>();

// Known program IDs for transaction analysis
const PROGRAM_IDS = {
  JUPITER: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  RAYDIUM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  ORCA: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  PUMP_FUN: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  MOONSHOT: 'MoonCVVNZFSYkqNXP6bxHLPL6QQJiMagDL3qcqUQTrG',
  TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  SYSTEM_PROGRAM: '11111111111111111111111111111111',
  ASSOCIATED_TOKEN_PROGRAM: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
};

class SingleWalletSubscription {
  private ws: WebSocket | null = null;
  private subscriptionId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private isConnecting = false;

  private walletAddress: string;
  private apiKey: string;
  private onTransaction: (transaction: Transaction) => void;
  private onStatusChange: (wallet: string, status: 'connected' | 'disconnected' | 'error') => void;
  private rpcUrl: string;

  constructor(
    walletAddress: string,
    apiKey: string,
    onTransaction: (transaction: Transaction) => void,
    onStatusChange: (wallet: string, status: 'connected' | 'disconnected' | 'error') => void,
    rpcUrl: string = 'https://mainnet.helius-rpc.com'
  ) {
    this.walletAddress = walletAddress;
    this.apiKey = apiKey;
    this.onTransaction = onTransaction;
    this.onStatusChange = onStatusChange;
    this.rpcUrl = rpcUrl;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = `wss://mainnet.helius-rpc.com/?api-key=${this.apiKey}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for wallet: ${this.walletAddress.slice(0, 8)}...`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribeToWallet();
        this.onStatusChange(this.walletAddress, 'connected');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log(`WebSocket disconnected for wallet: ${this.walletAddress.slice(0, 8)}...`);
        this.isConnecting = false;
        this.onStatusChange(this.walletAddress, 'disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`WebSocket error for wallet ${this.walletAddress.slice(0, 8)}...:`, error);
        this.isConnecting = false;
        this.onStatusChange(this.walletAddress, 'error');
      };

    } catch (error) {
      console.error(`Failed to create WebSocket connection for wallet ${this.walletAddress.slice(0, 8)}...:`, error);
      this.isConnecting = false;
      this.onStatusChange(this.walletAddress, 'error');
    }
  }

  private subscribeToWallet() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscriptionRequest = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000000),
      method: 'logsSubscribe',
      params: [
        {
          mentions: [this.walletAddress]
        },
        {
          commitment: 'confirmed'
        }
      ]
    };

    this.ws.send(JSON.stringify(subscriptionRequest));
  }

  private async handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      if (message.result && typeof message.result === 'number') {
        this.subscriptionId = message.result;
        console.log(`Subscribed to wallet ${this.walletAddress.slice(0, 8)}... with ID:`, this.subscriptionId);
        return;
      }

      if (message.method === 'logsNotification') {
        await this.processTransactionNotification(message);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private async processTransactionNotification(message: any) {
    try {
      const signature = message.params.result.value.signature;

      const transactionDetails = await this.fetchTransactionDetails(signature);
      if (transactionDetails) {
        const parsedTransaction = await this.parseTransaction(transactionDetails);
        if (parsedTransaction) {
          this.onTransaction(parsedTransaction);
        }
      }
    } catch (error) {
      console.error('Error processing transaction notification:', error);
    }
  }

  private async fetchTransactionDetails(signature: string) {
    try {
      const response = await fetch(`${this.rpcUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTransaction',
          params: [
            signature,
            {
              encoding: 'json',
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0
            }
          ]
        })
      });

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  private async parseTransaction(txData: any): Promise<Transaction | null> {
    try {
      const { blockTime, meta, transaction } = txData;

      if (!meta || meta.err) return null;

      const signature = transaction.signatures[0];
      const accountKeys = transaction.message.accountKeys;
      const preBalances = meta.preBalances;
      const postBalances = meta.postBalances;
      const preTokenBalances = meta.preTokenBalances || [];
      const postTokenBalances = meta.postTokenBalances || [];
      const instructions = transaction.message.instructions;
      const logs = meta.logMessages || [];

      const walletIndex = accountKeys.findIndex((key: string) => key === this.walletAddress);
      if (walletIndex === -1) return null;

      const solChange = (postBalances[walletIndex] - preBalances[walletIndex]) / 1e9;

      // Skip if no significant balance change
      if (Math.abs(solChange) < 0.00001) return null;

      // Parse token information
      const tokenInfo = await this.extractTokenInfo(
        preTokenBalances,
        postTokenBalances,
        instructions,
        logs,
        accountKeys
      );

      // Determine transaction type
      const transactionType = this.determineTransactionType(
        logs,
        instructions,
        tokenInfo,
        solChange
      );

      return {
        id: signature,
        timestamp: blockTime * 1000,
        time: new Date(blockTime * 1000).toLocaleString(),
        tokenName: tokenInfo.name,
        tokenTicker: tokenInfo.symbol,
        tokenAmount: tokenInfo.amount,
        solAmount: Math.abs(solChange).toFixed(6),
        wallet: this.walletAddress.slice(0, 8) + '...',
        type: transactionType,
        signature: signature.slice(0, 8) + '...',
        fee: (meta.fee / 1e9).toFixed(6),
        blockHeight: txData.slot?.toString() || 'N/A',
        fullWalletAddress: this.walletAddress
      };
    } catch (error) {
      console.error('Error parsing transaction:', error);
      return null;
    }
  }

  private async extractTokenInfo(
    preTokenBalances: any[],
    postTokenBalances: any[],
    instructions: any[],
    logs: string[],
    accountKeys: string[]
  ) {
    let tokenName = 'SOL Transaction';
    let tokenSymbol = 'SOL';
    let tokenAmount = 'N/A';

    // Check for token balance changes
    const allTokenBalances = [...preTokenBalances, ...postTokenBalances];
    const walletTokenBalances = allTokenBalances.filter(tb => tb.owner === this.walletAddress);

    if (walletTokenBalances.length > 0) {
      // Get the most significant token balance change
      let primaryToken = walletTokenBalances[0];
      let maxBalanceChange = 0;

      // Find the token with the largest balance change
      for (const tokenBalance of walletTokenBalances) {
        const mint = tokenBalance.mint;
        const preBalance = preTokenBalances.find(tb => tb.mint === mint && tb.owner === this.walletAddress);
        const postBalance = postTokenBalances.find(tb => tb.mint === mint && tb.owner === this.walletAddress);

        const preAmount = preBalance?.uiTokenAmount?.uiAmount || 0;
        const postAmount = postBalance?.uiTokenAmount?.uiAmount || 0;
        const balanceChange = Math.abs(postAmount - preAmount);

        if (balanceChange > maxBalanceChange) {
          maxBalanceChange = balanceChange;
          primaryToken = tokenBalance;
          tokenAmount = balanceChange.toLocaleString();
        }
      }

      // Get metadata for the primary token
      const mint = primaryToken.mint;
      const metadata = await this.getTokenMetadata(mint);

      if (metadata) {
        tokenName = metadata.name;
        tokenSymbol = metadata.symbol;

        // Override with NFT detection
        if (metadata.isNFT) {
          tokenName = `${metadata.name} (NFT)`;
          tokenAmount = '1';
        }
      }
    }

    // Parse logs for additional token information
    const logTokenInfo = this.parseLogsForTokenInfo(logs);
    if (logTokenInfo.name !== 'SOL Transaction') {
      tokenName = logTokenInfo.name;
      tokenSymbol = logTokenInfo.symbol;
    }

    // Check for pump.fun or moonshot transactions
    if (this.isPumpFunTransaction(instructions, logs)) {
      const pumpTokenInfo = this.parsePumpFunTransaction(logs);
      if (pumpTokenInfo.name) {
        tokenName = pumpTokenInfo.name;
        tokenSymbol = pumpTokenInfo.symbol;
        tokenAmount = pumpTokenInfo.amount || tokenAmount;
      }
    }

    return {
      name: tokenName,
      symbol: tokenSymbol,
      amount: tokenAmount
    };
  }

  private async getTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    // Check cache first
    if (tokenMetadataCache.has(mintAddress)) {
      return tokenMetadataCache.get(mintAddress)!;
    }

    // Check if request is already pending
    if (pendingRequests.has(mintAddress)) {
      return await pendingRequests.get(mintAddress)!;
    }

    // Create pending request
    const promise = this.fetchTokenMetadata(mintAddress);
    pendingRequests.set(mintAddress, promise);

    try {
      const result = await promise;
      pendingRequests.delete(mintAddress);
      return result;
    } catch (error) {
      pendingRequests.delete(mintAddress);
      return null;
    }
  }

  private async fetchTokenMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      // Method 1: Try Helius getAsset
      const response = await fetch(`${this.rpcUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getAsset',
          params: { id: mintAddress }
        })
      });

      const data = await response.json();

      if (data.result && data.result.content) {
        const result = data.result;

        // Determine if it's an NFT
        const isNFT = result.interface === 'ProgrammableNFT' ||
          result.interface === 'NonFungible' ||
          (result.token_info?.supply === 1 && result.token_info?.decimals === 0);

        const metadata: TokenMetadata = {
          name: result.content.metadata?.name || 'Unknown Token',
          symbol: result.content.metadata?.symbol || 'UNK',
          uri: result.content.metadata?.uri,
          decimals: result.token_info?.decimals ?? 6,
          isNFT,
          logoURI: result.content.links?.image
        };

        // Cache the metadata
        tokenMetadataCache.set(mintAddress, metadata);
        return metadata;
      }

      // Method 2: Try Jupiter Token List API as fallback
      return await this.fetchJupiterMetadata(mintAddress);

    } catch (error) {
      console.error(`Error fetching metadata for ${mintAddress}:`, error);

      // Fallback metadata
      const fallbackMetadata: TokenMetadata = {
        name: 'Unknown Token',
        symbol: mintAddress.slice(0, 6) + '...',
        decimals: 6
      };

      tokenMetadataCache.set(mintAddress, fallbackMetadata);
      return fallbackMetadata;
    }
  }

  private async fetchJupiterMetadata(mintAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch('https://token.jup.ag/strict');
      const tokenList = await response.json();

      const token = tokenList.find((t: any) => t.address === mintAddress);
      if (token) {
        const metadata: TokenMetadata = {
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI
        };
        tokenMetadataCache.set(mintAddress, metadata);
        return metadata;
      }
    } catch (error) {
      console.error('Jupiter metadata fetch failed:', error);
    }
    return null;
  }

  private parseLogsForTokenInfo(logs: string[]) {
    for (const log of logs) {
      if (log.includes('pump.fun') || log.includes('Pump')) {
        return { name: 'Pump.fun Token', symbol: 'PUMP' };
      }

      if (log.includes('moonshot') || log.includes('Moonshot')) {
        return { name: 'Moonshot Token', symbol: 'MOON' };
      }

      if (log.includes('Jupiter')) {
        return { name: 'Jupiter Swap', symbol: 'JUP' };
      }
      if (log.includes('Raydium')) {
        return { name: 'Raydium Swap', symbol: 'RAY' };
      }
      if (log.includes('Orca')) {
        return { name: 'Orca Swap', symbol: 'ORCA' };
      }
    }

    return { name: 'SOL Transaction', symbol: 'SOL' };
  }

  private isPumpFunTransaction(instructions: any[], logs: string[]): boolean {
    const hasPumpFunProgram = instructions.some(instruction =>
      instruction.programId === PROGRAM_IDS.PUMP_FUN ||
      instruction.programId === PROGRAM_IDS.MOONSHOT
    );

    const hasPumpFunLogs = logs.some(log =>
      log.toLowerCase().includes('pump') ||
      log.toLowerCase().includes('moonshot') ||
      log.toLowerCase().includes('bonding curve')
    );

    return hasPumpFunProgram || hasPumpFunLogs;
  }

  private parsePumpFunTransaction(logs: string[]) {
    let tokenInfo = {
      name: 'Pump.fun Token',
      symbol: 'PUMP',
      amount: 'N/A'
    };

    for (const log of logs) {
      const amountMatch = log.match(/amount:\s*(\d+(?:\.\d+)?)/);
      if (amountMatch) {
        tokenInfo.amount = parseFloat(amountMatch[1]).toLocaleString();
      }

      const symbolMatch = log.match(/symbol:\s*([A-Za-z0-9]+)/);
      if (symbolMatch) {
        tokenInfo.symbol = symbolMatch[1];
      }

      const nameMatch = log.match(/name:\s*([A-Za-z0-9\s]+)/);
      if (nameMatch) {
        tokenInfo.name = nameMatch[1];
      }

      if (log.toLowerCase().includes('moonshot')) {
        tokenInfo.name = 'Moonshot Token';
        tokenInfo.symbol = 'MOON';
      }
    }

    return tokenInfo;
  }

  private determineTransactionType(
    logs: string[],
    instructions: any[],
    tokenInfo: any,
    solChange: number
  ): string {
    for (const log of logs) {
      if (log.includes('swap') || log.includes('Swap')) {
        return 'Swap';
      }
      if (log.includes('buy') || log.includes('Buy')) {
        return 'Buy';
      }
      if (log.includes('sell') || log.includes('Sell')) {
        return 'Sell';
      }
    }

    for (const instruction of instructions) {
      const programId = instruction.programId;
      if (programId === PROGRAM_IDS.JUPITER) return 'Jupiter Swap';
      if (programId === PROGRAM_IDS.RAYDIUM) return 'Raydium Swap';
      if (programId === PROGRAM_IDS.ORCA) return 'Orca Swap';
      if (programId === PROGRAM_IDS.PUMP_FUN) return 'Pump.fun';
      if (programId === PROGRAM_IDS.MOONSHOT) return 'Moonshot';
    }

    return solChange > 0 ? 'Receive' : 'Send';
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for wallet ${this.walletAddress.slice(0, 8)}...`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`Attempting to reconnect wallet ${this.walletAddress.slice(0, 8)}... in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptionId = null;
    this.reconnectAttempts = 0;
  }
}

export class HeliusWebSocketManager {
  private subscriptions: Map<string, SingleWalletSubscription> = new Map();
  private onTransactionCallback: ((transaction: Transaction) => void) | null = null;
  private onConnectionStatusCallback: ((status: 'connected' | 'disconnected' | 'error', connectedCount: number) => void) | null = null;
  private connectedWallets = new Set<string>();

  constructor(private apiKey: string) { }

  connect() {
    WALLETS.forEach(wallet => {
      const subscription = new SingleWalletSubscription(
        wallet,
        this.apiKey,
        (transaction) => this.onTransactionCallback?.(transaction),
        (walletAddr, status) => this.handleWalletStatusChange(walletAddr, status)
      );

      this.subscriptions.set(wallet, subscription);

      setTimeout(() => {
        subscription.connect();
      }, this.subscriptions.size * 500);
    });
  }

  private handleWalletStatusChange(walletAddress: string, status: 'connected' | 'disconnected' | 'error') {
    if (status === 'connected') {
      this.connectedWallets.add(walletAddress);
    } else {
      this.connectedWallets.delete(walletAddress);
    }

    const connectedCount = this.connectedWallets.size;
    let overallStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

    if (connectedCount > 0) {
      overallStatus = 'connected';
    } else if (connectedCount === 0 && this.subscriptions.size > 0) {
      overallStatus = 'error';
    }

    this.onConnectionStatusCallback?.(overallStatus, connectedCount);
  }

  onTransaction(callback: (transaction: Transaction) => void) {
    this.onTransactionCallback = callback;
  }

  onConnectionStatus(callback: (status: 'connected' | 'disconnected' | 'error', connectedCount: number) => void) {
    this.onConnectionStatusCallback = callback;
  }

  disconnect() {
    this.subscriptions.forEach(subscription => {
      subscription.disconnect();
    });
    this.subscriptions.clear();
    this.connectedWallets.clear();
  }

  getConnectedWalletsCount(): number {
    return this.connectedWallets.size;
  }

  getTotalWalletsCount(): number {
    return WALLETS.length;
  }
}