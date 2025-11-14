# NetHawk Setup Instructions

## Quick Start

1. **System Requirements**
   - Linux system (Ubuntu 20.04+ recommended)
   - Root/sudo access
   - Python 3.8+
   - Network interface access

2. **Installation**
   ```bash
   # Install system dependencies
   sudo apt update
   sudo apt install python3-pip python3-venv libpcap-dev iptables-persistent
   
   # Create project directory
   mkdir nethawk && cd nethawk
   
   # Set up Python environment
   python3 -m venv nethawk_env
   source nethawk_env/bin/activate
   
   # Install Python packages
   pip install -r requirements.txt
   ```

3. **Configuration**
   - Copy the configuration template and modify for your network
   - Set up proper network interface in config
   - Configure firewall settings and whitelist

4. **Permissions**
   ```bash
   # Option 1: Set capabilities (recommended)
   sudo setcap cap_net_raw,cap_net_admin=eip $(which python3)
   
   # Option 2: Run as root (less secure)
   sudo python3 main.py
   ```

5. **Running**
   ```bash
   # Terminal 1: Main NetHawk
   python3 main.py
   
   # Terminal 2: Dashboard
   python3 main.py dashboard
   ```

## Important Notes

- **This is a complete implementation guide** for NetHawk, a real NIDPS system
- **Requires Linux with root privileges** for packet capture and firewall management
- **Test in isolated environment first** before production deployment
- **Monitor system resources** as packet capture can be CPU intensive
- **Regular model retraining** recommended for optimal detection accuracy

## Security Warnings

- Running with root privileges poses security risks
- Ensure proper firewall configuration to avoid blocking legitimate traffic
- Test whitelist functionality thoroughly
- Implement proper logging and monitoring
- Keep threat intelligence feeds updated

## Production Considerations

- Use dedicated hardware for high-traffic networks
- Implement load balancing for multiple sensors
- Set up centralized logging and monitoring
- Regular backup of detection models and configurations
- Establish incident response procedures