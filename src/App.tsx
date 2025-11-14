import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, Ban, Eye, Database, Settings, RefreshCw } from 'lucide-react';
import Dashboard from './components/Dashboard';
import PacketMonitor from './components/PacketMonitor';
import ThreatAnalysis from './components/ThreatAnalysis';
import BlockedIPs from './components/BlockedIPs';
import SystemLogs from './components/SystemLogs';
import ModelTraining from './components/ModelTraining';
import { NetworkPacket, ThreatEvent, BlockedIP, SystemEvent } from './types/nidps';
import { generateMockPacket, classifyPacket } from './utils/mockData';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [stats, setStats] = useState({
    totalPackets: 0,
    threatsDetected: 0,
    blockedIPs: 0,
    accuracy: 94.7
  });

  // Simulate real-time packet capture
  useEffect(() => {
    if (!isMonitoring) return;

    // More realistic packet generation with variable intervals
    const generatePackets = () => {
      // Generate 1-5 packets per interval to simulate burst traffic
      const packetCount = Math.floor(Math.random() * 5) + 1;
      const newPackets: NetworkPacket[] = [];
      
      for (let i = 0; i < packetCount; i++) {
        const newPacket = generateMockPacket();
        const classification = classifyPacket(newPacket);
        
        const packetWithClassification = {
          ...newPacket,
          prediction: classification.prediction,
          confidence: classification.confidence,
          timestamp: new Date(Date.now() + i) // Slight time offset for each packet
        };
        
        newPackets.push(packetWithClassification);
        
        // Handle malicious packets with enhanced logic
        if (classification.prediction === 'malicious' && classification.confidence > 0.65) {
          const threat: ThreatEvent = {
            id: (Date.now() + i).toString(),
            timestamp: new Date(Date.now() + i),
            sourceIP: newPacket.sourceIP,
            destinationIP: newPacket.destinationIP,
            attackType: classification.attackType || 'Unknown Attack',
            severity: classification.confidence > 0.85 ? 'high' : 
                     classification.confidence > 0.75 ? 'medium' : 'low',
            blocked: classification.confidence > 0.7,
            confidence: classification.confidence
          };

          setThreats(prev => [threat, ...prev.slice(0, 99)]);
          setStats(prev => ({ ...prev, threatsDetected: prev.threatsDetected + 1 }));

          // Auto-block IP if confidence is high enough
          if (classification.confidence > 0.7) {
            const existingBlock = blockedIPs.find(ip => ip.ipAddress === newPacket.sourceIP);
            if (!existingBlock) {
              const blockDuration = classification.confidence > 0.9 ? 15 : 10; // Higher confidence = longer block
              const blockedIP: BlockedIP = {
                id: (Date.now() + i).toString(),
                ipAddress: newPacket.sourceIP,
                blockedAt: new Date(),
                reason: `${classification.attackType} detected (${(classification.confidence * 100).toFixed(1)}% confidence)`,
                autoUnblock: true,
                unblockAt: new Date(Date.now() + blockDuration * 60 * 1000)
              };

              setBlockedIPs(prev => [blockedIP, ...prev]);
              setStats(prev => ({ ...prev, blockedIPs: prev.blockedIPs + 1 }));

              // Log system event
              const systemEvent: SystemEvent = {
                id: (Date.now() + i).toString(),
                timestamp: new Date(),
                type: 'IP_BLOCKED',
                message: `Automatically blocked ${newPacket.sourceIP} due to ${classification.attackType} (Confidence: ${(classification.confidence * 100).toFixed(1)}%)`,
                severity: classification.confidence > 0.9 ? 'error' : 'warning'
              };

              setSystemEvents(prev => [systemEvent, ...prev.slice(0, 99)]);
            }
          }
        }
      }
      
      // Update packets and stats
      setPackets(prev => [...newPackets, ...prev.slice(0, 1000 - newPackets.length)]);
      setStats(prev => ({ ...prev, totalPackets: prev.totalPackets + newPackets.length }));
    };

    // Variable interval to simulate realistic network traffic
    const getRandomInterval = () => Math.random() * 800 + 200; // 200-1000ms
    
    let timeoutId: NodeJS.Timeout;
    const scheduleNext = () => {
      timeoutId = setTimeout(() => {
        if (isMonitoring) {
          generatePackets();
          scheduleNext();
        }
      }, getRandomInterval());
    };
    
    scheduleNext();

    return () => clearTimeout(timeoutId);
  }, [isMonitoring, blockedIPs]);

  // Auto-unblock IPs
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setBlockedIPs(prev => 
        prev.filter(ip => !ip.autoUnblock || !ip.unblockAt || ip.unblockAt > now)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'monitor', label: 'Packet Monitor', icon: Eye },
    { id: 'threats', label: 'Threat Analysis', icon: AlertTriangle },
    { id: 'blocked', label: 'Blocked IPs', icon: Ban },
    { id: 'logs', label: 'System Logs', icon: Database },
    { id: 'training', label: 'ML Training', icon: Settings }
  ];

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    const event: SystemEvent = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: isMonitoring ? 'MONITORING_STOPPED' : 'MONITORING_STARTED',
      message: `Network monitoring ${isMonitoring ? 'stopped' : 'started'}`,
      severity: 'info'
    };
    setSystemEvents(prev => [event, ...prev.slice(0, 99)]);
  };

  const clearLogs = () => {
    setPackets([]);
    setThreats([]);
    setSystemEvents([]);
    setStats(prev => ({ ...prev, totalPackets: 0, threatsDetected: 0 }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">NetHawk</h1>
              <p className="text-sm text-gray-400">AI-Powered Network Security Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}</span>
            </div>
            
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isMonitoring 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats}
            recentPackets={packets.slice(0, 10)}
            recentThreats={threats.slice(0, 5)}
            blockedIPs={blockedIPs}
          />
        )}
        
        {activeTab === 'monitor' && (
          <PacketMonitor 
            packets={packets}
            isMonitoring={isMonitoring}
          />
        )}
        
        {activeTab === 'threats' && (
          <ThreatAnalysis 
            threats={threats}
            packets={packets}
          />
        )}
        
        {activeTab === 'blocked' && (
          <BlockedIPs 
            blockedIPs={blockedIPs}
            onUnblock={(id) => setBlockedIPs(prev => prev.filter(ip => ip.id !== id))}
          />
        )}
        
        {activeTab === 'logs' && (
          <SystemLogs 
            events={systemEvents}
            packets={packets}
          />
        )}
        
        {activeTab === 'training' && (
          <ModelTraining 
            accuracy={stats.accuracy}
            totalPackets={stats.totalPackets}
          />
        )}
      </main>
    </div>
  );
}

export default App;