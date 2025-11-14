import React, { useState } from 'react';
import { Eye, Filter, Download, Search } from 'lucide-react';
import { NetworkPacket } from '../types/nidps';

interface PacketMonitorProps {
  packets: NetworkPacket[];
  isMonitoring: boolean;
}

export default function PacketMonitor({ packets, isMonitoring }: PacketMonitorProps) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('all');

  const filteredPackets = packets.filter(packet => {
    const matchesFilter = filter === 'all' || 
      (filter === 'malicious' && packet.prediction === 'malicious') ||
      (filter === 'normal' && packet.prediction === 'normal');
    
    const matchesSearch = searchTerm === '' || 
      packet.sourceIP.includes(searchTerm) || 
      packet.destinationIP.includes(searchTerm);
    
    const matchesProtocol = protocolFilter === 'all' || packet.protocol === protocolFilter;
    
    return matchesFilter && matchesSearch && matchesProtocol;
  });

  const exportPackets = () => {
    const csvContent = [
      'Timestamp,Source IP,Destination IP,Source Port,Destination Port,Protocol,Size,Prediction,Confidence',
      ...filteredPackets.map(p => 
        `${p.timestamp.toISOString()},${p.sourceIP},${p.destinationIP},${p.sourcePort},${p.destinationPort},${p.protocol},${p.packetSize},${p.prediction || 'unknown'},${p.confidence || 0}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_packets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Eye className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Live Packet Monitor</h2>
            <p className="text-gray-400">Real-time network traffic analysis</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isMonitoring ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isMonitoring ? 'Capturing' : 'Stopped'}</span>
          </div>
          
          <button
            onClick={exportPackets}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-white font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Threat Level</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Packets</option>
              <option value="malicious">Malicious Only</option>
              <option value="normal">Normal Only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Protocol</label>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Search IP</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by IP address..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Network Packets ({filteredPackets.length.toLocaleString()})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prediction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredPackets.slice(0, 100).map(packet => (
                <tr key={packet.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {packet.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-white font-mono">{packet.sourceIP}</div>
                    <div className="text-gray-400 text-xs">:{packet.sourcePort}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="text-white font-mono">{packet.destinationIP}</div>
                    <div className="text-gray-400 text-xs">:{packet.destinationPort}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      packet.protocol === 'TCP' ? 'bg-blue-900/30 text-blue-300' :
                      packet.protocol === 'UDP' ? 'bg-green-900/30 text-green-300' :
                      'bg-purple-900/30 text-purple-300'
                    }`}>
                      {packet.protocol}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {packet.packetSize}B
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {packet.prediction && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        packet.prediction === 'malicious' 
                          ? 'bg-red-900/30 text-red-300 border border-red-700' 
                          : 'bg-green-900/30 text-green-300 border border-green-700'
                      }`}>
                        {packet.prediction.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {packet.confidence ? `${(packet.confidence * 100).toFixed(1)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPackets.length === 0 && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No packets match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );
}