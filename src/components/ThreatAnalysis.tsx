import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Target, Shield } from 'lucide-react';
import { ThreatEvent, NetworkPacket } from '../types/nidps';

interface ThreatAnalysisProps {
  threats: ThreatEvent[];
  packets: NetworkPacket[];
}

export default function ThreatAnalysis({ threats, packets }: ThreatAnalysisProps) {
  const threatStats = useMemo(() => {
    const attackTypes = threats.reduce((acc, threat) => {
      acc[threat.attackType] = (acc[threat.attackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityCount = threats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    const topSourceIPs = threats.reduce((acc, threat) => {
      acc[threat.sourceIP] = (acc[threat.sourceIP] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      attackTypes: Object.entries(attackTypes).sort(([,a], [,b]) => b - a),
      severityCount,
      topSourceIPs: Object.entries(topSourceIPs).sort(([,a], [,b]) => b - a).slice(0, 10)
    };
  }, [threats]);

  const recentThreats = threats.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Threat Analysis</h2>
          <p className="text-gray-400">Comprehensive security threat overview</p>
        </div>
      </div>

      {/* Threat Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Severity Distribution</h3>
            <Target className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-red-400">High</span>
              <span className="text-white font-bold">{threatStats.severityCount.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-orange-400">Medium</span>
              <span className="text-white font-bold">{threatStats.severityCount.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-400">Low</span>
              <span className="text-white font-bold">{threatStats.severityCount.low}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Attack Types</h3>
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <div className="space-y-2">
            {threatStats.attackTypes.slice(0, 5).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm truncate">{type}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Source IPs</h3>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <div className="space-y-2">
            {threatStats.topSourceIPs.slice(0, 5).map(([ip, count]) => (
              <div key={ip} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm font-mono">{ip}</span>
                <span className="text-white font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Threat Timeline */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Recent Threat Events
          </h3>
        </div>
        
        <div className="p-6">
          {recentThreats.length > 0 ? (
            <div className="space-y-4">
              {recentThreats.map(threat => (
                <div key={threat.id} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg border-l-4 border-red-500">
                  <div className={`w-3 h-3 rounded-full mt-2 ${
                    threat.severity === 'high' ? 'bg-red-500' : 
                    threat.severity === 'medium' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`}></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{threat.attackType}</h4>
                      <span className="text-xs text-gray-400">
                        {threat.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Source IP:</span>
                        <span className="text-white font-mono ml-2">{threat.sourceIP}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Target IP:</span>
                        <span className="text-white font-mono ml-2">{threat.destinationIP}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-white ml-2">{(threat.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        threat.severity === 'high' ? 'bg-red-900/30 text-red-300' :
                        threat.severity === 'medium' ? 'bg-orange-900/30 text-orange-300' :
                        'bg-yellow-900/30 text-yellow-300'
                      }`}>
                        {threat.severity.toUpperCase()}
                      </span>
                      
                      {threat.blocked && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900/30 text-red-300 border border-red-700">
                          BLOCKED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-400">No threats detected</p>
              <p className="text-sm text-gray-500">Your network is secure</p>
            </div>
          )}
        </div>
      </div>

      {/* Attack Pattern Analysis */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Attack Pattern Analysis</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-3">Most Common Attack Types</h4>
              <div className="space-y-2">
                {threatStats.attackTypes.map(([type, count], index) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                    <span className="text-gray-300">{index + 1}. {type}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">Threat Statistics</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Total Threats</span>
                  <span className="text-red-400 font-bold">{threats.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Blocked Automatically</span>
                  <span className="text-orange-400 font-bold">
                    {threats.filter(t => t.blocked).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Unique Source IPs</span>
                  <span className="text-blue-400 font-bold">
                    {new Set(threats.map(t => t.sourceIP)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}