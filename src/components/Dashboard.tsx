import React from 'react';
import { Activity, Shield, AlertTriangle, Ban, TrendingUp, Clock } from 'lucide-react';
import { NetworkPacket, ThreatEvent, BlockedIP } from '../types/nidps';

interface DashboardProps {
  stats: {
    totalPackets: number;
    threatsDetected: number;
    blockedIPs: number;
    accuracy: number;
  };
  recentPackets: NetworkPacket[];
  recentThreats: ThreatEvent[];
  blockedIPs: BlockedIP[];
}

export default function Dashboard({ stats, recentPackets, recentThreats, blockedIPs }: DashboardProps) {
  const threatRate = stats.totalPackets > 0 ? (stats.threatsDetected / stats.totalPackets * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Packets</p>
              <p className="text-2xl font-bold text-white">{stats.totalPackets.toLocaleString()}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400">Live monitoring</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Threats Detected</p>
              <p className="text-2xl font-bold text-red-400">{stats.threatsDetected}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">Threat rate: {threatRate.toFixed(2)}%</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Blocked IPs</p>
              <p className="text-2xl font-bold text-orange-400">{stats.blockedIPs}</p>
            </div>
            <Ban className="w-8 h-8 text-orange-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-400">Active blocks: {blockedIPs.length}</span>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">ML Accuracy</p>
              <p className="text-2xl font-bold text-green-400">{stats.accuracy}%</p>
            </div>
            <Shield className="w-8 h-8 text-green-400" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-green-400">Model performing well</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Packets */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-400" />
              Recent Network Traffic
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentPackets.slice(0, 5).map(packet => (
                <div key={packet.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      packet.prediction === 'malicious' ? 'bg-red-400' : 'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {packet.sourceIP} → {packet.destinationIP}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {packet.protocol}:{packet.destinationPort} • {packet.packetSize}B
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {packet.timestamp.toLocaleTimeString()}
                    </p>
                    {packet.confidence && (
                      <p className="text-xs text-gray-300">
                        {(packet.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Threats */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              Recent Threats
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentThreats.length > 0 ? recentThreats.map(threat => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      threat.severity === 'high' ? 'bg-red-500' : 
                      threat.severity === 'medium' ? 'bg-orange-400' : 'bg-yellow-400'
                    }`}></div>
                    <div>
                      <p className="text-white text-sm font-medium">{threat.attackType}</p>
                      <p className="text-gray-400 text-xs">
                        From: {threat.sourceIP}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {threat.timestamp.toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-red-400">
                      {threat.blocked ? 'BLOCKED' : 'DETECTED'}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-400">NetHawk: No threats detected recently</p>
                  <p className="text-sm text-gray-500">Your network is secure</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <span className="text-gray-300">Packet Capture</span>
            <span className="text-green-400 font-medium">Active</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <span className="text-gray-300">ML Detection</span>
            <span className="text-green-400 font-medium">Running</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <span className="text-gray-300">Auto-blocking</span>
            <span className="text-green-400 font-medium">Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}