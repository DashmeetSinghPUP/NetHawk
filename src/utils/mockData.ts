import { NetworkPacket } from '../types/nidps';

// Enhanced port definitions with more realistic patterns
const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995, 3389, 5432, 3306, 8080, 8443, 587, 465];
const maliciousPorts = [1337, 31337, 12345, 54321, 9999, 6666, 4444, 1234, 2222, 4321, 8888];
const scanningPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 993, 995, 1433, 3389];
const protocols: ('TCP' | 'UDP' | 'ICMP')[] = ['TCP', 'UDP', 'ICMP'];

const attackTypes = [
  'Port Scan',
  'DDoS Attack',
  'Brute Force',
  'SQL Injection',
  'XSS Attack',
  'Buffer Overflow',
  'Malware Communication',
  'Data Exfiltration',
  'Reconnaissance',
  'Lateral Movement',
  'Command & Control',
  'Privilege Escalation'
];

// More realistic IP ranges
const internalIPs = [
  '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103', '192.168.1.104',
  '10.0.0.50', '10.0.0.51', '10.0.0.52', '172.16.0.100', '172.16.0.101'
];

const legitimateExternalIPs = [
  '8.8.8.8', '1.1.1.1', '208.67.222.222', '74.125.224.72', '151.101.193.140',
  '13.107.42.14', '52.96.0.0', '40.96.0.0'
];

const suspiciousIPs = [
  '185.220.101.42', '198.98.51.189', '45.142.214.123', '91.240.118.172',
  '103.253.145.12', '194.147.78.45', '23.129.64.218', '89.248.165.91',
  '46.166.139.111', '178.128.83.165', '159.203.176.62', '134.209.24.42'
];

// Threat intelligence database simulation
const threatIntelligence = {
  knownMaliciousIPs: new Set(suspiciousIPs),
  botnetIPs: new Set(['185.220.101.42', '198.98.51.189', '45.142.214.123']),
  scannerIPs: new Set(['91.240.118.172', '103.253.145.12', '194.147.78.45']),
  malwareC2: new Set(['23.129.64.218', '89.248.165.91', '46.166.139.111'])
};

// Enhanced packet generation with more realistic patterns
function getRandomIP(suspicious = false): string {
  if (suspicious) {
    return suspiciousIPs[Math.floor(Math.random() * suspiciousIPs.length)];
  }
  
  // Mix of internal and external legitimate IPs
  const allLegitimate = [...internalIPs, ...legitimateExternalIPs];
  return allLegitimate[Math.floor(Math.random() * allLegitimate.length)];
}

function getRandomPort(malicious = false, scanning = false): number {
  if (scanning) {
    return scanningPorts[Math.floor(Math.random() * scanningPorts.length)];
  }
  const pool = malicious ? maliciousPorts : commonPorts;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Simulate network traffic patterns (more traffic during business hours)
function getTrafficMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 9 && hour <= 17) {
    return 1.5; // Business hours - more traffic
  } else if (hour >= 22 || hour <= 6) {
    return 0.3; // Night time - less traffic
  }
  return 1.0; // Normal traffic
}

export function generateMockPacket(): NetworkPacket {
  const trafficMultiplier = getTrafficMultiplier();
  const baseMaliciousRate = 0.12; // 12% base malicious rate
  const adjustedMaliciousRate = baseMaliciousRate * (2 - trafficMultiplier); // More attacks during low traffic
  
  const isMalicious = Math.random() < adjustedMaliciousRate;
  const isScanning = Math.random() < 0.05; // 5% scanning activity
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];
  
  const sourceIP = getRandomIP(isMalicious);
  const destinationIP = getRandomIP(false);
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    sourceIP,
    destinationIP,
    sourcePort: getRandomPort(isMalicious, isScanning),
    destinationPort: getRandomPort(isMalicious, isScanning),
    protocol,
    packetSize: generateRealisticPacketSize(protocol, isMalicious),
    flags: protocol === 'TCP' ? ['SYN', 'ACK', 'FIN', 'RST'][Math.floor(Math.random() * 4)] : undefined,
    ttl: generateRealisticTTL(sourceIP)
  };
}

function generateRealisticPacketSize(protocol: string, isMalicious: boolean): number {
  if (isMalicious) {
    // Malicious packets might be unusually large or small
    if (Math.random() < 0.3) {
      return Math.floor(Math.random() * 100) + 20; // Very small packets
    } else if (Math.random() < 0.3) {
      return Math.floor(Math.random() * 500) + 1400; // Very large packets
    }
  }
  
  // Normal packet sizes based on protocol
  switch (protocol) {
    case 'TCP':
      return Math.floor(Math.random() * 1200) + 100;
    case 'UDP':
      return Math.floor(Math.random() * 800) + 64;
    case 'ICMP':
      return Math.floor(Math.random() * 200) + 28;
    default:
      return Math.floor(Math.random() * 1000) + 64;
  }
}

function generateRealisticTTL(sourceIP: string): number {
  // Different OS have different default TTL values
  if (internalIPs.includes(sourceIP)) {
    return [64, 128][Math.floor(Math.random() * 2)]; // Linux/Windows internal
  } else if (suspiciousIPs.includes(sourceIP)) {
    return [32, 48, 96, 112][Math.floor(Math.random() * 4)]; // Suspicious/modified TTL
  } else {
    return [64, 128, 255][Math.floor(Math.random() * 3)]; // Standard TTL values
  }
}

// Enhanced classification with more sophisticated logic
export function classifyPacket(packet: NetworkPacket): {
  prediction: 'normal' | 'malicious';
  confidence: number;
  attackType?: string;
} {
  let suspicionScore = 0;
  let attackType = '';
  let reasons: string[] = [];

  // Enhanced threat intelligence checks
  if (threatIntelligence.knownMaliciousIPs.has(packet.sourceIP)) {
    suspicionScore += 0.45;
    reasons.push('Known malicious IP');
    
    if (threatIntelligence.botnetIPs.has(packet.sourceIP)) {
      attackType = 'Botnet Communication';
      suspicionScore += 0.15;
    } else if (threatIntelligence.scannerIPs.has(packet.sourceIP)) {
      attackType = 'Network Reconnaissance';
      suspicionScore += 0.10;
    } else if (threatIntelligence.malwareC2.has(packet.sourceIP)) {
      attackType = 'Command & Control';
      suspicionScore += 0.20;
    }
  }

  // Enhanced port analysis
  if (maliciousPorts.includes(packet.sourcePort) || maliciousPorts.includes(packet.destinationPort)) {
    suspicionScore += 0.25;
    reasons.push('Suspicious port usage');
    attackType = attackType || 'Backdoor Communication';
  }
  
  // Port scanning detection
  if (scanningPorts.includes(packet.destinationPort) && packet.protocol === 'TCP') {
    suspicionScore += 0.15;
    reasons.push('Port scanning behavior');
    attackType = attackType || 'Port Scan';
  }

  // Enhanced packet size analysis
  if (packet.packetSize > 1400) {
    suspicionScore += 0.18;
    reasons.push('Unusually large packet');
    attackType = attackType || 'Buffer Overflow Attempt';
  } else if (packet.packetSize < 40) {
    suspicionScore += 0.15;
    reasons.push('Unusually small packet');
    attackType = attackType || 'Reconnaissance';
  }

  // TTL analysis for OS fingerprinting and spoofing detection
  if (packet.ttl < 32 || packet.ttl > 255) {
    suspicionScore += 0.20;
    reasons.push('Suspicious TTL value');
    attackType = attackType || 'IP Spoofing';
  }
  
  // Protocol-specific analysis
  if (packet.protocol === 'ICMP' && packet.packetSize > 100) {
    suspicionScore += 0.12;
    reasons.push('Large ICMP packet');
    attackType = attackType || 'ICMP Flood';
  }

  // High port numbers (potential backdoors)
  if (packet.sourcePort > 49152 && packet.destinationPort > 49152) {
    suspicionScore += 0.08;
    reasons.push('High port communication');
    attackType = attackType || 'Suspicious Communication';
  }
  
  // Privileged port access from external sources
  if (!internalIPs.includes(packet.sourceIP) && packet.destinationPort < 1024) {
    suspicionScore += 0.12;
    reasons.push('External access to privileged port');
    attackType = attackType || 'Unauthorized Access Attempt';
  }

  // Add some ML model uncertainty
  const uncertainty = (Math.random() - 0.5) * 0.08;
  suspicionScore += uncertainty;

  // Calculate final confidence with some randomness
  const confidence = Math.min(Math.max(suspicionScore + Math.random() * 0.15, 0.1), 0.98);
  const prediction = confidence > 0.5 ? 'malicious' : 'normal';

  // Assign attack type if malicious but none detected
  if (prediction === 'malicious' && !attackType) {
    // Choose attack type based on characteristics
    if (reasons.includes('Port scanning behavior')) {
      attackType = 'Port Scan';
    } else if (reasons.includes('Large ICMP packet')) {
      attackType = 'DDoS Attack';
    } else if (reasons.includes('Suspicious port usage')) {
      attackType = 'Backdoor Communication';
    } else {
      attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
    }
  }

  return {
    prediction,
    confidence: Math.round(confidence * 100) / 100,
    attackType: prediction === 'malicious' ? attackType : undefined
  };
}