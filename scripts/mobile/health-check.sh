#!/bin/sh
# Health check script for MediBot container

set -e

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if the web app is accessible
if ! curl -f -s http://localhost:8080/health > /dev/null; then
    echo "ERROR: MediBot web app is not accessible"
    exit 1
fi

# Check if main page loads
if ! curl -f -s http://localhost:8080/ | grep -q "MediBot" > /dev/null 2>&1; then
    echo "ERROR: MediBot app content not found"
    exit 1
fi

echo "OK: MediBot is healthy"
exit 0