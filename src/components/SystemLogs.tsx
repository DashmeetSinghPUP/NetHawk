import React, { useState } from 'react';
import { Database, Filter, Download, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { SystemEvent, NetworkPacket } from '../types/nidps';

interface SystemLogsProps {
  events: SystemEvent[];
  packets: NetworkPacket[];
}

export default function SystemLogs({ events, packets }: SystemLogsProps) {
  const [filter, setFilter] = useState('all');
  const [logType, setLogType] = useState('events');

  const filteredEvents = events.filter(event => 
    filter === 'all' || event.severity === filter
  );

  const recentPacketLogs = packets.slice(0, 50);

  const exportLogs = () => {
    const data = logType === 'events' ? filteredEvents : recentPacketLogs;
    const headers = logType === 'events' 
      ? 'Timestamp,Type,Message,Severity'
      : 'Timestamp,Source IP,Destination IP,Protocol,Prediction,Confidence';
    
    const csvContent = [
      headers,
      ...data.map(item => {
        if (logType === 'events') {
          const event = item as SystemEvent;
          return `${event.timestamp.toISOString()},${event.type},"${event.message}",${event.severity}`;
        } else {
          const packet = item as NetworkPacket;
          return `${packet.timestamp.toISOString()},${packet.sourceIP},${packet.destinationIP},${packet.protocol},${packet.prediction || 'unknown'},${packet.confidence || 0}`;
        }
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${logType}_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-orange-500 bg-orange-900/20';
      default:
        return 'border-blue-500 bg-blue-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">System Logs</h2>
            <p className="text-gray-400">Comprehensive system activity logging</p>
          </div>
        </div>
        
        <button
          onClick={exportLogs}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-white font-medium">Log Controls</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Log Type</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="events">System Events</option>
              <option value="packets">Packet Logs</option>
            </select>
          </div>
          
          {logType === 'events' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Severity Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="all">All Severities</option>
                <option value="error">Errors Only</option>
                <option value="warning">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Log Display */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            {logType === 'events' ? 'System Events' : 'Packet Logs'} 
            ({logType === 'events' ? filteredEvents.length : recentPacketLogs.length})
          </h3>
        </div>
        
        <div className="p-6">
          {logType === 'events' ? (
            <div className="space-y-3">
              {filteredEvents.length > 0 ? filteredEvents.map(event => (
                <div key={event.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(event.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-medium">{event.type}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.severity === 'error' ? 'bg-red-900/30 text-red-300' :
                            event.severity === 'warning' ? 'bg-orange-900/30 text-orange-300' :
                            'bg-blue-900/30 text-blue-300'
                          }`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300">{event.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {event.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No system events match the current filter</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Protocol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentPacketLogs.map(packet => (
                    <tr key={packet.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {packet.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                        {packet.sourceIP}:{packet.sourcePort}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">
                        {packet.destinationIP}:{packet.destinationPort}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          packet.protocol === 'TCP' ? 'bg-blue-900/30 text-blue-300' :
                          packet.protocol === 'UDP' ? 'bg-green-900/30 text-green-300' :
                          'bg-purple-900/30 text-purple-300'
                        }`}>
                          {packet.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {packet.prediction && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            packet.prediction === 'malicious' 
                              ? 'bg-red-900/30 text-red-300' 
                              : 'bg-green-900/30 text-green-300'
                          }`}>
                            {packet.prediction.toUpperCase()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-blue-400">{events.length}</p>
            </div>
            <Info className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Warnings</p>
              <p className="text-2xl font-bold text-orange-400">
                {events.filter(e => e.severity === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Errors</p>
              <p className="text-2xl font-bold text-red-400">
                {events.filter(e => e.severity === 'error').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}