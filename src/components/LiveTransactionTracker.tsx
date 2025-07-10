
// app/components/LiveTransactionTracker.tsx
import { useState, useEffect } from 'react';
import TransactionTable from './TransactionTable';
import type { Transaction } from '../types/transaction';

interface LiveTransactionTrackerProps {
    initialTransactions: Transaction[];
}

export default function LiveTransactionTracker({ initialTransactions }: LiveTransactionTrackerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [error, setError] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(true);

    const fetchTransactions = async () => {
        if (!isLive) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transactions', {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.transactions) {
                setTransactions(data.transactions);
                setLastUpdate(new Date());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLiveUpdates = () => {
        setIsLive(!isLive);
    };

    const manualRefresh = () => {
        fetchTransactions();
    };

    useEffect(() => {
        if (!isLive) return;

        // Set up polling every 25 seconds (random between 20-30)
        const getRandomInterval = () => Math.floor(Math.random() * (30000 - 20000 + 1)) + 20000;

        const startPolling = () => {
            const interval = setTimeout(() => {
                fetchTransactions().finally(() => {
                    if (isLive) startPolling(); // Schedule next poll
                });
            }, getRandomInterval());

            return interval;
        };

        const timeoutId = startPolling();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [isLive]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Solana Wallet Transaction Tracker</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' :
                                isLive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                        <span>{loading ? 'Updating...' : isLive ? 'Live' : 'Paused'}</span>
                    </div>

                    <span>Last update: {lastUpdate.toLocaleTimeString()}</span>

                    <div className="flex gap-2">
                        <button
                            onClick={toggleLiveUpdates}
                            className={`px-3 py-1 rounded text-white font-medium ${isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {isLive ? 'Pause Live' : 'Start Live'}
                        </button>

                        <button
                            onClick={manualRefresh}
                            disabled={loading}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Refreshing...' : 'Refresh Now'}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500">
                        {transactions.length} transactions
                    </div>
                </div>

                {error && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        Error: {error}
                    </div>
                )}
            </div>

            <TransactionTable transactions={transactions} />

            <div className="mt-4 text-sm text-gray-500">
                <p>• Using CryptoAPIs.io for comprehensive Solana blockchain data</p>
                <p>• Currently tracking 15 wallets with up to 50 transactions each</p>
                <p>• Live updates every 20-30 seconds (randomized to avoid rate limits)</p>
                <p>• Shows up to 300 most recent transactions with detailed analysis</p>
                <p>• Enhanced detection for Pump.fun, Wrapped SOL, and token swaps</p>
            </div>
        </div>
    );
}
