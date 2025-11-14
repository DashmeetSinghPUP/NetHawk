import React, { useState } from 'react';
import { Ban, Clock, Unlock, Search, AlertTriangle } from 'lucide-react';
import { BlockedIP } from '../types/nidps';

interface BlockedIPsProps {
  blockedIPs: BlockedIP[];
  onUnblock: (id: string) => void;
}

export default function BlockedIPs({ blockedIPs, onUnblock }: BlockedIPsProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIPs = blockedIPs.filter(ip => 
    ip.ipAddress.includes(searchTerm) || 
    ip.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeRemaining = (unblockAt?: Date) => {
    if (!unblockAt) return null;
    const now = new Date();
    const remaining = unblockAt.getTime() - now.getTime();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Ban className="w-6 h-6 text-red-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Blocked IP Addresses</h2>
            <p className="text-gray-400">Automatically blocked malicious sources</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm">Total Blocked: </span>
            <span className="text-red-400 font-bold">{blockedIPs.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by IP address or reason..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Blocked IPs Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Blocked IPs ({filteredIPs.length})
          </h3>
        </div>
        
        {filteredIPs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Blocked At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Auto-Unblock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredIPs.map(ip => {
                  const timeRemaining = getTimeRemaining(ip.unblockAt);
                  
                  return (
                    <tr key={ip.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-white font-mono font-medium">{ip.ipAddress}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {ip.blockedAt.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                        {ip.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ip.autoUnblock 
                            ? 'bg-green-900/30 text-green-300 border border-green-700' 
                            : 'bg-red-900/30 text-red-300 border border-red-700'
                        }`}>
                          {ip.autoUnblock ? 'Yes' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ip.autoUnblock && timeRemaining ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-400">{timeRemaining}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onUnblock(ip.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Unblock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No blocked IPs match your search</p>
              </>
            ) : (
              <>
                <Ban className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-400">No IPs are currently blocked</p>
                <p className="text-sm text-gray-500">Your firewall is clean</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Block Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Auto-Blocked</p>
              <p className="text-2xl font-bold text-red-400">
                {blockedIPs.filter(ip => ip.autoUnblock).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Manual Blocks</p>
              <p className="text-2xl font-bold text-orange-400">
                {blockedIPs.filter(ip => !ip.autoUnblock).length}
              </p>
            </div>
            <Ban className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-400">
                {blockedIPs.filter(ip => {
                  if (!ip.unblockAt) return false;
                  const remaining = ip.unblockAt.getTime() - new Date().getTime();
                  return remaining > 0 && remaining < 5 * 60 * 1000; // Less than 5 minutes
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}