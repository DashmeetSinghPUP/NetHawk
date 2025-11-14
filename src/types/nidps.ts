export interface NetworkPacket {
  id: string;
  timestamp: Date;
  sourceIP: string;
  destinationIP: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP';
  packetSize: number;
  flags?: string;
  ttl: number;
  prediction?: 'normal' | 'malicious';
  confidence?: number;
}

export interface ThreatEvent {
  id: string;
  timestamp: Date;
  sourceIP: string;
  destinationIP: string;
  attackType: string;
  severity: 'low' | 'medium' | 'high';
  blocked: boolean;
  confidence: number;
}

export interface BlockedIP {
  id: string;
  ipAddress: string;
  blockedAt: Date;
  reason: string;
  autoUnblock: boolean;
  unblockAt?: Date;
}

export interface SystemEvent {
  id: string;
  timestamp: Date;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface MLModel {
  name: string;
  accuracy: number;
  lastTrained: Date;
  features: string[];
  status: 'active' | 'training' | 'inactive';
}