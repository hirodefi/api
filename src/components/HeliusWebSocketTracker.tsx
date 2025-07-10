// app/components/HeliusWebSocketTracker.tsx
import { useState, useEffect, useRef } from 'react';
import type { Transaction } from '../types/transaction';
import TransactionTable from './TransactionTable';
import { HeliusWebSocketManager } from '../lib/helius-websocket';

interface HeliusWebSocketTrackerProps {
    initialTransactions: Transaction[];
}

export default function HeliusWebSocketTracker({ initialTransactions }: HeliusWebSocketTrackerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
    const [isLive, setIsLive] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [connectedWallets, setConnectedWallets] = useState(0);
    const [totalWallets, setTotalWallets] = useState(15);
    const [error, setError] = useState<string | null>(null);
    const wsManager = useRef<HeliusWebSocketManager | null>(null);

    useEffect(() => {
        const apiKey = import.meta.env.NEXT_PUBLIC_HELIUS_API_KEY;
        if (!apiKey) {
            setError('Helius API key not found in environment variables');
            console.error('NEXT_PUBLIC_HELIUS_API_KEY not found');
            return;
        }

        wsManager.current = new HeliusWebSocketManager(apiKey);
        setTotalWallets(wsManager.current.getTotalWalletsCount());

        wsManager.current.onTransaction((newTransaction) => {
            setTransactions(prev => {
                // Add new transaction and keep only the most recent 300
                const updated = [newTransaction, ...prev].slice(0, 300);
                // Sort by timestamp (newest first)
                return updated.sort((a, b) => b.timestamp - a.timestamp);
            });
            setLastUpdate(new Date());
            setError(null); // Clear any previous errors when receiving transactions
        });

        wsManager.current.onConnectionStatus((status, connectedCount) => {
            setConnectionStatus(status);
            setConnectedWallets(connectedCount);

            if (status === 'error' && connectedCount === 0) {
                setError('All wallet connections failed. Check your Helius API key and network connection.');
            } else if (status === 'connected') {
                setError(null);
            }
        });

        return () => {
            wsManager.current?.disconnect();
        };
    }, []);

    const toggleLiveMode = () => {
        if (isLive) {
            wsManager.current?.disconnect();
            setIsLive(false);
            setConnectedWallets(0);
            setConnectionStatus('disconnected');
        } else {
            setError(null);
            wsManager.current?.connect();
            setIsLive(true);
        }
    };

    const getStatusColor = () => {
        if (!isLive) return 'bg-gray-400';

        switch (connectionStatus) {
            case 'connected': return 'bg-green-500';
            case 'disconnected': return 'bg-yellow-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getStatusText = () => {
        if (!isLive) return 'Offline';

        switch (connectionStatus) {
            case 'connected': return `Live (${connectedWallets}/${totalWallets} wallets)`;
            case 'disconnected': return 'Connecting...';
            case 'error': return 'Connection Error';
            default: return 'Unknown';
        }
    };

    const getConnectionProgress = () => {
        if (!isLive) return 0;
        return (connectedWallets / totalWallets) * 100;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Solana Wallet Transaction Tracker</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''
                            }`}></div>
                        <span>{getStatusText()}</span>
                    </div>

                    <span>Last update: {lastUpdate.toLocaleTimeString()}</span>

                    <div className="flex gap-2">
                        <button
                            onClick={toggleLiveMode}
                            className={`px-3 py-1 rounded text-white font-medium ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {isLive ? 'Stop Live' : 'Start Live'}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500">
                        {transactions.length} transactions
                    </div>
                </div>

                {/* Connection Progress Bar */}
                {isLive && (
                    <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Wallet Connections</span>
                            <span>{connectedWallets}/{totalWallets}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${connectionStatus === 'connected' ? 'bg-green-500' :
                                        connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                                    }`}
                                style={{ width: `${getConnectionProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        <strong>Error:</strong> {error}
                        <div className="mt-1 text-xs">
                            Make sure you have set NEXT_PUBLIC_HELIUS_API_KEY in your .env.local file
                        </div>
                    </div>
                )}

                {isLive && connectedWallets > 0 && connectedWallets < totalWallets && (
                    <div className="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
                        <strong>Partial Connection:</strong> {connectedWallets} out of {totalWallets} wallets connected.
                        Some transactions might be missed.
                    </div>
                )}
            </div>

            <TransactionTable transactions={transactions} />

            <div className="mt-4 text-sm text-gray-500">
                <p>• Using Helius WebSocket for real-time Solana transaction streaming</p>
                <p>• Each wallet has its own WebSocket connection (Helius limitation: 1 address per subscription)</p>
                <p>• Real-time updates via WebSocket (no polling required)</p>
                <p>• Advanced parsing for Pump.fun, Jupiter, Raydium, and Orca transactions</p>
                <p>• Automatic token name and symbol resolution with caching</p>
                <p>• Connections are staggered to avoid server overload</p>
            </div>
        </div>
    );
}