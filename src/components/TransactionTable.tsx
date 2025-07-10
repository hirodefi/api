// app/components/TransactionTable.tsx
import { useState } from 'react';
import type { Transaction } from '../types/transaction';

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    }
  };

  const formatTransactionId = (id: string) => {
    return id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-6)}` : id;
  };

  const getFullWalletAddress = (wallet: string) => {
    return wallet;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                Token Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Token Ticker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Token Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                SOL Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Wallet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Block Height
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                Fee
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="animate-pulse text-lg mb-2">⏳</div>
                    <div>No transactions found</div>
                    <div className="text-sm text-gray-400 mt-1">
                      Start live mode to see real-time transactions
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  {/* Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-mono text-xs">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </div>
                    <div className="font-mono text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  {/* Transaction ID - Clickable to copy */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => copyToClipboard(tx.id, `tx-${tx.id}`)}
                      className="font-mono text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer relative group"
                      title="Click to copy full transaction ID"
                    >
                      {formatTransactionId(tx.id)}
                      {copiedItem === `tx-${tx.id}` && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Copy TX ID
                      </span>
                    </button>
                  </td>

                  {/* Token Name */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-[140px] truncate" title={tx.tokenName}>
                      {tx.tokenName}
                    </div>
                  </td>

                  {/* Token Ticker */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-medium">
                      {tx.tokenTicker}
                    </span>
                  </td>

                  {/* Token Amount */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {tx.tokenAmount}
                  </td>

                  {/* SOL Amount */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {tx.solAmount} SOL
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${tx.type === 'Buy' || tx.type === 'Receive' ? 'bg-green-100 text-green-800' :
                        tx.type === 'Sell' || tx.type === 'Send' ? 'bg-red-100 text-red-800' :
                          tx.type.includes('Swap') ? 'bg-purple-100 text-purple-800' :
                            tx.type === 'Pump.fun' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {tx.type}
                    </span>
                  </td>

                  {/* Wallet - Clickable to copy */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      onClick={() => copyToClipboard(getFullWalletAddress(tx.wallet), `wallet-${tx.wallet}`)}
                      className="font-mono text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition-colors cursor-pointer relative group"
                      title="Click to copy wallet address"
                    >
                      {tx.wallet}
                      {copiedItem === `wallet-${tx.wallet}` && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                          Copied!
                        </span>
                      )}
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        Copy Wallet
                      </span>
                    </button>
                  </td>

                  {/* Block Height */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {tx.blockHeight}
                  </td>

                  {/* Fee */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {tx.fee} SOL
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with scroll hint */}
      {transactions.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500 text-center">
          <div className="flex justify-between items-center">
            <span>Showing {transactions.length} transactions</span>
            <span className="hidden sm:block">💡 Scroll horizontally to see all columns</span>
            <span>Click wallet addresses and transaction IDs to copy</span>
          </div>
        </div>
      )}
    </div>
  );
}