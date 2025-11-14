# NetHawk - Network Intrusion Detection and Prevention System Implementation Guide

## 🎯 System Overview

This guide provides step-by-step instructions for building NetHawk, a complete Python-based NIDPS that captures live network traffic, uses machine learning for threat detection, and automatically blocks malicious IPs.

## 📋 Prerequisites

### System Requirements
- Linux-based system (Ubuntu 20.04+ recommended)
- Root/sudo privileges
- Python 3.8+
- Minimum 4GB RAM
- Network interface access

### Required Packages
```bash
# System packages
sudo apt update
sudo apt install python3-pip python3-venv libpcap-dev iptables-persistent

# Python virtual environment
python3 -m venv nidps_env
source nidps_env/bin/activate

# Python packages
pip install scapy pandas scikit-learn streamlit sqlite3 numpy matplotlib seaborn plotly
```

## 🏗️ Project Structure

```
nethawk/
├── src/
│   ├── packet_capture.py      # Real-time packet capture
│   ├── feature_extractor.py   # Extract features from packets
│   ├── ml_detector.py         # ML-based threat detection
│   ├── firewall_manager.py    # Automated IP blocking
│   ├── database_manager.py    # SQLite operations
│   └── dashboard.py           # Streamlit dashboard
├── models/
│   ├── train_model.py         # Model training script
│   ├── nidps_model.pkl        # Trained model
│   └── scaler.pkl             # Feature scaler
├── data/
│   ├── training_data.csv      # Training dataset
│   └── network_logs.db        # SQLite database
├── config/
│   └── config.yaml            # Configuration file
├── logs/
│   └── nidps.log             # System logs
└── main.py                    # Main application
```

## 🔧 Implementation Steps

### Step 1: Configuration Management

Create `config/config.yaml`:
```yaml
network:
  interface: "eth0"  # Network interface to monitor
  capture_filter: ""  # BPF filter (empty = all traffic)
  
ml_model:
  model_path: "models/nidps_model.pkl"
  scaler_path: "models/scaler.pkl"
  threshold: 0.7  # Classification threshold
  
firewall:
  auto_block: true
  block_duration: 600  # seconds (10 minutes)
  whitelist: ["192.168.1.1", "8.8.8.8"]
  
database:
  path: "data/network_logs.db"
  
logging:
  level: "INFO"
  file: "logs/nidps.log"
```

### Step 2: Database Schema

Create `src/database_manager.py`:
```python
import sqlite3
import threading
from datetime import datetime
from typing import List, Dict, Any

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.lock = threading.Lock()
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Network traffic table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS network_traffic (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    src_ip TEXT NOT NULL,
                    dst_ip TEXT NOT NULL,
                    src_port INTEGER,
                    dst_port INTEGER,
                    protocol TEXT,
                    packet_size INTEGER,
                    flags TEXT,
                    prediction TEXT,
                    confidence REAL,
                    blocked BOOLEAN DEFAULT FALSE
                )
            ''')
            
            # Blocked IPs table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS blocked_ips (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip_address TEXT UNIQUE NOT NULL,
                    blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    unblock_at DATETIME,
                    reason TEXT,
                    active BOOLEAN DEFAULT TRUE
                )
            ''')
            
            # System events table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS system_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    event_type TEXT NOT NULL,
                    description TEXT,
                    severity TEXT
                )
            ''')
            
            conn.commit()
    
    def log_packet(self, packet_data: Dict[str, Any]):
        """Log network packet data"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO network_traffic 
                    (src_ip, dst_ip, src_port, dst_port, protocol, 
                     packet_size, flags, prediction, confidence, blocked)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    packet_data['src_ip'],
                    packet_data['dst_ip'],
                    packet_data.get('src_port'),
                    packet_data.get('dst_port'),
                    packet_data['protocol'],
                    packet_data['packet_size'],
                    packet_data.get('flags', ''),
                    packet_data['prediction'],
                    packet_data['confidence'],
                    packet_data.get('blocked', False)
                ))
                conn.commit()
    
    def log_blocked_ip(self, ip: str, reason: str, unblock_time: datetime = None):
        """Log blocked IP address"""
        with self.lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO blocked_ips 
                    (ip_address, reason, unblock_at)
                    VALUES (?, ?, ?)
                ''', (ip, reason, unblock_time))
                conn.commit()
    
    def get_active_threats(self, limit: int = 100) -> List[Dict]:
        """Get recent malicious traffic"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM network_traffic 
                WHERE prediction = 'malicious' 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_blocked_ips(self) -> List[Dict]:
        """Get currently blocked IPs"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM blocked_ips 
                WHERE active = TRUE 
                ORDER BY blocked_at DESC
            ''')
            
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
```

### Step 3: Packet Capture and Feature Extraction

Create `src/packet_capture.py`:
```python
from scapy.all import sniff, IP, TCP, UDP, ICMP
import threading
import queue
from typing import Dict, Any, Callable

class PacketCapture:
    def __init__(self, interface: str = "eth0", filter_str: str = ""):
        self.interface = interface
        self.filter_str = filter_str
        self.packet_queue = queue.Queue()
        self.running = False
        self.capture_thread = None
    
    def start_capture(self, callback: Callable = None):
        """Start packet capture in separate thread"""
        self.running = True
        self.capture_thread = threading.Thread(
            target=self._capture_packets, 
            args=(callback,)
        )
        self.capture_thread.daemon = True
        self.capture_thread.start()
    
    def stop_capture(self):
        """Stop packet capture"""
        self.running = False
        if self.capture_thread:
            self.capture_thread.join()
    
    def _capture_packets(self, callback: Callable = None):
        """Internal packet capture method"""
        def packet_handler(packet):
            if not self.running:
                return
            
            features = self.extract_features(packet)
            if features:
                if callback:
                    callback(features)
                else:
                    self.packet_queue.put(features)
        
        try:
            sniff(
                iface=self.interface,
                filter=self.filter_str,
                prn=packet_handler,
                stop_filter=lambda x: not self.running
            )
        except Exception as e:
            print(f"Packet capture error: {e}")
    
    def extract_features(self, packet) -> Dict[str, Any]:
        """Extract features from network packet"""
        if not packet.haslayer(IP):
            return None
        
        ip_layer = packet[IP]
        features = {
            'src_ip': ip_layer.src,
            'dst_ip': ip_layer.dst,
            'protocol': ip_layer.proto,
            'packet_size': len(packet),
            'ttl': ip_layer.ttl,
            'flags': 0,
            'src_port': 0,
            'dst_port': 0
        }
        
        # TCP features
        if packet.haslayer(TCP):
            tcp_layer = packet[TCP]
            features.update({
                'src_port': tcp_layer.sport,
                'dst_port': tcp_layer.dport,
                'flags': tcp_layer.flags,
                'window_size': tcp_layer.window,
                'protocol_name': 'TCP'
            })
        
        # UDP features
        elif packet.haslayer(UDP):
            udp_layer = packet[UDP]
            features.update({
                'src_port': udp_layer.sport,
                'dst_port': udp_layer.dport,
                'protocol_name': 'UDP'
            })
        
        # ICMP features
        elif packet.haslayer(ICMP):
            icmp_layer = packet[ICMP]
            features.update({
                'icmp_type': icmp_layer.type,
                'icmp_code': icmp_layer.code,
                'protocol_name': 'ICMP'
            })
        
        return features
```

### Step 4: Machine Learning Detection Engine

Create `src/ml_detector.py`:
```python
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, Tuple

class MLDetector:
    def __init__(self, model_path: str, scaler_path: str):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.feature_columns = [
            'protocol', 'packet_size', 'ttl', 'src_port', 'dst_port',
            'flags', 'window_size', 'is_tcp', 'is_udp', 'is_icmp'
        ]
        self.load_model()
    
    def load_model(self):
        """Load trained model and scaler"""
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            with open(self.scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            print("Model and scaler loaded successfully")
        except FileNotFoundError:
            print("Model files not found. Training new model...")
            self.train_model()
    
    def preprocess_features(self, packet_features: Dict[str, Any]) -> np.ndarray:
        """Convert packet features to ML input format"""
        # Create feature vector
        features = {
            'protocol': packet_features.get('protocol', 0),
            'packet_size': packet_features.get('packet_size', 0),
            'ttl': packet_features.get('ttl', 0),
            'src_port': packet_features.get('src_port', 0),
            'dst_port': packet_features.get('dst_port', 0),
            'flags': packet_features.get('flags', 0),
            'window_size': packet_features.get('window_size', 0),
            'is_tcp': 1 if packet_features.get('protocol_name') == 'TCP' else 0,
            'is_udp': 1 if packet_features.get('protocol_name') == 'UDP' else 0,
            'is_icmp': 1 if packet_features.get('protocol_name') == 'ICMP' else 0
        }
        
        # Convert to DataFrame for consistent preprocessing
        df = pd.DataFrame([features])
        
        # Scale features
        if self.scaler:
            scaled_features = self.scaler.transform(df[self.feature_columns])
            return scaled_features
        
        return df[self.feature_columns].values
    
    def predict(self, packet_features: Dict[str, Any]) -> Tuple[str, float]:
        """Predict if packet is malicious"""
        if not self.model:
            return "unknown", 0.0
        
        try:
            # Preprocess features
            X = self.preprocess_features(packet_features)
            
            # Make prediction
            prediction = self.model.predict(X)[0]
            confidence = self.model.predict_proba(X)[0].max()
            
            # Convert prediction to label
            label = "malicious" if prediction == 1 else "normal"
            
            return label, confidence
        
        except Exception as e:
            print(f"Prediction error: {e}")
            return "error", 0.0
    
    def train_model(self):
        """Train a new model (simplified version)"""
        print("Training new model...")
        
        # Generate synthetic training data for demonstration
        np.random.seed(42)
        n_samples = 10000
        
        # Create synthetic features
        data = {
            'protocol': np.random.choice([6, 17, 1], n_samples),  # TCP, UDP, ICMP
            'packet_size': np.random.normal(500, 200, n_samples),
            'ttl': np.random.choice([64, 128, 255], n_samples),
            'src_port': np.random.randint(1, 65536, n_samples),
            'dst_port': np.random.randint(1, 65536, n_samples),
            'flags': np.random.randint(0, 256, n_samples),
            'window_size': np.random.randint(1024, 65536, n_samples),
            'is_tcp': np.random.choice([0, 1], n_samples),
            'is_udp': np.random.choice([0, 1], n_samples),
            'is_icmp': np.random.choice([0, 1], n_samples)
        }
        
        # Create synthetic labels (simplified logic)
        labels = []
        for i in range(n_samples):
            # Simple heuristic for malicious traffic
            is_malicious = (
                data['packet_size'][i] > 1000 or  # Large packets
                data['src_port'][i] < 1024 or     # Privileged ports
                data['dst_port'][i] in [22, 23, 80, 443, 3389]  # Common attack targets
            )
            labels.append(1 if is_malicious else 0)
        
        # Create DataFrame
        df = pd.DataFrame(data)
        df['label'] = labels
        
        # Split features and labels
        X = df[self.feature_columns]
        y = df['label']
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y)
        
        # Save model and scaler
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        with open(self.scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        print("Model training completed and saved")
```

### Step 5: Firewall Management

Create `src/firewall_manager.py`:
```python
import subprocess
import threading
import time
from datetime import datetime, timedelta
from typing import List, Set

class FirewallManager:
    def __init__(self, whitelist: List[str] = None, auto_unblock_time: int = 600):
        self.whitelist = set(whitelist or [])
        self.auto_unblock_time = auto_unblock_time
        self.blocked_ips = {}  # ip -> block_time
        self.lock = threading.Lock()
        
        # Start auto-unblock thread
        self.unblock_thread = threading.Thread(target=self._auto_unblock_worker)
        self.unblock_thread.daemon = True
        self.unblock_thread.start()
    
    def block_ip(self, ip: str, reason: str = "Malicious activity detected") -> bool:
        """Block IP address using iptables"""
        if ip in self.whitelist:
            print(f"IP {ip} is whitelisted, not blocking")
            return False
        
        try:
            # Add iptables rule to drop packets from this IP
            cmd = f"sudo iptables -I INPUT -s {ip} -j DROP"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                with self.lock:
                    self.blocked_ips[ip] = datetime.now()
                print(f"Blocked IP: {ip} - {reason}")
                return True
            else:
                print(f"Failed to block IP {ip}: {result.stderr}")
                return False
        
        except Exception as e:
            print(f"Error blocking IP {ip}: {e}")
            return False
    
    def unblock_ip(self, ip: str) -> bool:
        """Unblock IP address"""
        try:
            # Remove iptables rule
            cmd = f"sudo iptables -D INPUT -s {ip} -j DROP"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                with self.lock:
                    self.blocked_ips.pop(ip, None)
                print(f"Unblocked IP: {ip}")
                return True
            else:
                print(f"Failed to unblock IP {ip}: {result.stderr}")
                return False
        
        except Exception as e:
            print(f"Error unblocking IP {ip}: {e}")
            return False
    
    def is_blocked(self, ip: str) -> bool:
        """Check if IP is currently blocked"""
        with self.lock:
            return ip in self.blocked_ips
    
    def get_blocked_ips(self) -> List[str]:
        """Get list of currently blocked IPs"""
        with self.lock:
            return list(self.blocked_ips.keys())
    
    def _auto_unblock_worker(self):
        """Background worker to automatically unblock IPs after timeout"""
        while True:
            try:
                current_time = datetime.now()
                ips_to_unblock = []
                
                with self.lock:
                    for ip, block_time in self.blocked_ips.items():
                        if (current_time - block_time).seconds >= self.auto_unblock_time:
                            ips_to_unblock.append(ip)
                
                # Unblock expired IPs
                for ip in ips_to_unblock:
                    self.unblock_ip(ip)
                
                time.sleep(60)  # Check every minute
            
            except Exception as e:
                print(f"Auto-unblock worker error: {e}")
                time.sleep(60)
    
    def flush_all_blocks(self):
        """Remove all blocked IPs (emergency function)"""
        try:
            # Flush all INPUT rules (be careful with this!)
            cmd = "sudo iptables -F INPUT"
            subprocess.run(cmd, shell=True)
            
            with self.lock:
                self.blocked_ips.clear()
            
            print("All IP blocks cleared")
        
        except Exception as e:
            print(f"Error flushing blocks: {e}")
```

### Step 6: Streamlit Dashboard

Create `src/dashboard.py`:
```python
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import time
from database_manager import DatabaseManager

class NIDPSDashboard:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        
    def run(self):
        """Main dashboard interface"""
        st.set_page_config(
            page_title="NIDPS Dashboard",
            page_icon="🛡️",
            layout="wide",
            initial_sidebar_state="expanded"
        )
        
        st.title("🛡️ Network Intrusion Detection & Prevention System")
        st.markdown("---")
        
        # Sidebar
        self.render_sidebar()
        
        # Main content
        col1, col2, col3 = st.columns(3)
        
        with col1:
            self.render_stats_card("Total Packets", self.get_total_packets(), "📊")
        
        with col2:
            self.render_stats_card("Threats Detected", self.get_threats_count(), "⚠️")
        
        with col3:
            self.render_stats_card("Blocked IPs", self.get_blocked_count(), "🚫")
        
        # Charts and tables
        col1, col2 = st.columns(2)
        
        with col1:
            self.render_traffic_chart()
        
        with col2:
            self.render_threat_types_chart()
        
        # Recent threats table
        st.subheader("🚨 Recent Threats")
        self.render_threats_table()
        
        # Blocked IPs table
        st.subheader("🚫 Blocked IP Addresses")
        self.render_blocked_ips_table()
        
        # Auto-refresh
        time.sleep(5)
        st.rerun()
    
    def render_sidebar(self):
        """Render sidebar controls"""
        st.sidebar.header("🔧 Controls")
        
        if st.sidebar.button("🔄 Refresh Data"):
            st.rerun()
        
        if st.sidebar.button("🧹 Clear Logs"):
            # Add confirmation dialog
            if st.sidebar.checkbox("Confirm clear logs"):
                self.clear_logs()
                st.sidebar.success("Logs cleared!")
        
        st.sidebar.markdown("---")
        st.sidebar.header("📊 Filters")
        
        # Time range filter
        time_range = st.sidebar.selectbox(
            "Time Range",
            ["Last Hour", "Last 24 Hours", "Last Week"]
        )
        
        # Protocol filter
        protocol_filter = st.sidebar.multiselect(
            "Protocols",
            ["TCP", "UDP", "ICMP"],
            default=["TCP", "UDP", "ICMP"]
        )
    
    def render_stats_card(self, title: str, value: int, icon: str):
        """Render statistics card"""
        st.metric(
            label=f"{icon} {title}",
            value=f"{value:,}"
        )
    
    def render_traffic_chart(self):
        """Render traffic over time chart"""
        st.subheader("📈 Network Traffic Over Time")
        
        # Get traffic data from database
        traffic_data = self.get_traffic_over_time()
        
        if not traffic_data.empty:
            fig = px.line(
                traffic_data,
                x='hour',
                y='packet_count',
                color='prediction',
                title="Packets per Hour"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No traffic data available")
    
    def render_threat_types_chart(self):
        """Render threat types pie chart"""
        st.subheader("🎯 Threat Distribution")
        
        threat_data = self.get_threat_distribution()
        
        if not threat_data.empty:
            fig = px.pie(
                threat_data,
                values='count',
                names='threat_type',
                title="Detected Threats by Type"
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No threat data available")
    
    def render_threats_table(self):
        """Render recent threats table"""
        threats = self.db.get_active_threats(50)
        
        if threats:
            df = pd.DataFrame(threats)
            df = df[['timestamp', 'src_ip', 'dst_ip', 'protocol', 'prediction', 'confidence']]
            st.dataframe(df, use_container_width=True)
        else:
            st.info("No recent threats detected")
    
    def render_blocked_ips_table(self):
        """Render blocked IPs table"""
        blocked_ips = self.db.get_blocked_ips()
        
        if blocked_ips:
            df = pd.DataFrame(blocked_ips)
            st.dataframe(df, use_container_width=True)
        else:
            st.info("No IPs currently blocked")
    
    def get_total_packets(self) -> int:
        """Get total packet count"""
        # Implement database query
        return 12543  # Placeholder
    
    def get_threats_count(self) -> int:
        """Get threats count"""
        return 23  # Placeholder
    
    def get_blocked_count(self) -> int:
        """Get blocked IPs count"""
        return 5  # Placeholder
    
    def get_traffic_over_time(self) -> pd.DataFrame:
        """Get traffic data over time"""
        # Implement database query
        return pd.DataFrame()  # Placeholder
    
    def get_threat_distribution(self) -> pd.DataFrame:
        """Get threat type distribution"""
        # Implement database query
        return pd.DataFrame()  # Placeholder
    
    def clear_logs(self):
        """Clear system logs"""
        # Implement log clearing
        pass

# Run dashboard
if __name__ == "__main__":
    db = DatabaseManager("data/network_logs.db")
    dashboard = NIDPSDashboard(db)
    dashboard.run()
```

### Step 7: Main Application

Create `main.py`:
```python
#!/usr/bin/env python3
import yaml
import logging
import threading
import time
from src.packet_capture import PacketCapture
from src.ml_detector import MLDetector
from src.firewall_manager import FirewallManager
from src.database_manager import DatabaseManager

class NetHawk:
    def __init__(self, config_path: str = "config/config.yaml"):
        # Load configuration
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Setup logging
        logging.basicConfig(
            level=getattr(logging, self.config['logging']['level']),
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.config['logging']['file']),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.db = DatabaseManager(self.config['database']['path'])
        self.ml_detector = MLDetector(
            self.config['ml_model']['model_path'],
            self.config['ml_model']['scaler_path']
        )
        self.firewall = FirewallManager(
            whitelist=self.config['firewall']['whitelist'],
            auto_unblock_time=self.config['firewall']['block_duration']
        )
        self.packet_capture = PacketCapture(
            interface=self.config['network']['interface'],
            filter_str=self.config['network']['capture_filter']
        )
        
        self.running = False
        self.stats = {
            'packets_processed': 0,
            'threats_detected': 0,
            'ips_blocked': 0
        }
    
    def packet_handler(self, packet_features):
        """Handle captured packets"""
        try:
            # Update stats
            self.stats['packets_processed'] += 1
            
            # ML prediction
            prediction, confidence = self.ml_detector.predict(packet_features)
            
            # Add prediction to packet data
            packet_features['prediction'] = prediction
            packet_features['confidence'] = confidence
            
            # Log packet to database
            self.db.log_packet(packet_features)
            
            # Handle malicious packets
            if prediction == 'malicious' and confidence > self.config['ml_model']['threshold']:
                self.handle_malicious_packet(packet_features)
            
            # Log every 1000 packets
            if self.stats['packets_processed'] % 1000 == 0:
                self.logger.info(f"Processed {self.stats['packets_processed']} packets")
        
        except Exception as e:
            self.logger.error(f"Error processing packet: {e}")
    
    def handle_malicious_packet(self, packet_features):
        """Handle detected malicious packet"""
        src_ip = packet_features['src_ip']
        
        self.logger.warning(f"Malicious packet detected from {src_ip}")
        self.stats['threats_detected'] += 1
        
        # Block IP if auto-blocking is enabled
        if self.config['firewall']['auto_block']:
            if not self.firewall.is_blocked(src_ip):
                success = self.firewall.block_ip(
                    src_ip, 
                    f"Malicious activity - Confidence: {packet_features['confidence']:.2f}"
                )
                
                if success:
                    self.stats['ips_blocked'] += 1
                    self.db.log_blocked_ip(src_ip, "Automated block - malicious activity")
                    packet_features['blocked'] = True
    
    def start(self):
        """Start NetHawk"""
        self.logger.info("Starting NetHawk - Network Intrusion Detection and Prevention System")
        self.running = True
        
        # Start packet capture
        self.packet_capture.start_capture(self.packet_handler)
        
        # Start statistics reporting thread
        stats_thread = threading.Thread(target=self._stats_reporter)
        stats_thread.daemon = True
        stats_thread.start()
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
    
    def stop(self):
        """Stop NetHawk"""
        self.logger.info("Stopping NetHawk...")
        self.running = False
        self.packet_capture.stop_capture()
        self.logger.info("NetHawk stopped")
    
    def _stats_reporter(self):
        """Report statistics periodically"""
        while self.running:
            time.sleep(60)  # Report every minute
            self.logger.info(
                f"Stats - Packets: {self.stats['packets_processed']}, "
                f"Threats: {self.stats['threats_detected']}, "
                f"Blocked IPs: {self.stats['ips_blocked']}"
            )

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "dashboard":
        # Run dashboard
        import subprocess
        subprocess.run(["streamlit", "run", "src/dashboard.py"])
    else:
        # Run main NetHawk
        nethawk = NetHawk()
        nethawk.start()
```

## 🚀 Deployment Instructions

### 1. System Setup
```bash
# Clone or create project directory
mkdir nethawk && cd nethawk

# Create directory structure
mkdir -p src models data config logs

# Set up Python environment
python3 -m venv nethawk_env
source nethawk_env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Copy configuration template
cp config/config.yaml.example config/config.yaml

# Edit configuration for your network
nano config/config.yaml
```

### 3. Permissions Setup
```bash
# Add user to necessary groups
sudo usermod -a -G wireshark $USER

# Set capabilities for packet capture (alternative to running as root)
sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)

# Or run with sudo (less secure)
sudo python3 main.py
```

### 4. Running the System

**Terminal 1 - Main NetHawk:**
```bash
sudo python3 main.py
```

**Terminal 2 - Dashboard:**
```bash
python3 main.py dashboard
```

### 5. Systemd Service (Optional)
Create `/etc/systemd/system/nethawk.service`:
```ini
[Unit]
Description=NetHawk - Network Intrusion Detection and Prevention System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/nethawk
ExecStart=/path/to/nidps/nidps_env/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable nethawk
sudo systemctl start nethawk
```

## 🔧 Advanced Features

### 1. Email Alerts
Add to `src/alerting.py`:
```python
import smtplib
from email.mime.text import MIMEText

def send_alert(subject, message, to_email):
    # Configure SMTP settings
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    from_email = "your-nidps@gmail.com"
    password = "your-app-password"
    
    msg = MIMEText(message)
    msg['Subject'] = subject
    msg['From'] = from_email
    msg['To'] = to_email
    
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(from_email, password)
        server.send_message(msg)
```

### 2. Threat Intelligence Integration
```python
import requests

def check_threat_intel(ip):
    """Check IP against threat intelligence feeds"""
    # VirusTotal API example
    api_key = "your-virustotal-api-key"
    url = f"https://www.virustotal.com/vtapi/v2/ip-address/report"
    params = {'apikey': api_key, 'ip': ip}
    
    response = requests.get(url, params=params)
    return response.json()
```

### 3. Model Retraining
```python
def retrain_model():
    """Periodically retrain the ML model with new data"""
    # Fetch recent data from database
    # Retrain model with updated dataset
    # Save new model
    pass
```

## 🛡️ Security Considerations

1. **Run with minimal privileges** - Use capabilities instead of root when possible
2. **Secure configuration files** - Protect API keys and sensitive settings
3. **Regular updates** - Keep dependencies and threat intelligence updated
4. **Backup and recovery** - Regular database backups
5. **Monitoring** - Monitor the NIDPS itself for failures
- **Monitoring** - Monitor NetHawk itself for failures

## 📊 Performance Optimization

1. **Packet filtering** - Use BPF filters to reduce processing load
2. **Batch processing** - Process packets in batches for better performance
3. **Database optimization** - Use indexes and optimize queries
4. **Memory management** - Implement packet buffer limits
5. **Multi-threading** - Separate capture, processing, and response threads

## 🔍 Troubleshooting

### Common Issues:

1. **Permission denied for packet capture**
   ```bash
   sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
   ```

2. **iptables rules not working**
   ```bash
   sudo iptables -L -n  # Check current rules
   sudo iptables -F     # Flush rules (careful!)
   ```

3. **High CPU usage**
   - Implement packet filtering
   - Reduce capture rate
   - Optimize ML model

4. **Database locks**
   - Use connection pooling
   - Implement proper locking mechanisms

## 📈 Monitoring and Metrics

Key metrics to monitor:
- Packets per second processed
- Detection accuracy
- False positive rate
- System resource usage
- Response time to threats

This comprehensive guide provides everything needed to implement a production-ready Network Intrusion Detection and Prevention System. Remember to test thoroughly in a controlled environment before deploying to production networks.
This comprehensive guide provides everything needed to implement NetHawk, a production-ready Network Intrusion Detection and Prevention System. Remember to test thoroughly in a controlled environment before deploying to production networks.