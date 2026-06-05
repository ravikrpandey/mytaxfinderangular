#!/bin/bash
# ================================================================
# MyTaxFinder — Simple Server Fix Script
# Run step by step on Ubuntu server
# ================================================================

echo ""
echo "======================================================"
echo "  Step 1: Check existing Nginx setup"
echo "======================================================"
echo ""
echo "--- sites-enabled:"
ls /etc/nginx/sites-enabled/ 2>/dev/null || echo "Directory not found"

echo ""
echo "--- sites-available:"
ls /etc/nginx/sites-available/ 2>/dev/null || echo "Directory not found"

echo ""
echo "--- conf.d:"
ls /etc/nginx/conf.d/ 2>/dev/null || echo "Directory empty or not found"

echo ""
echo "--- /var/www/ contents:"
ls /var/www/ 2>/dev/null || echo "Not found"

echo ""
echo "======================================================"
echo "  Step 2: Show current active Nginx config"
echo "======================================================"
echo ""
# Try to find the active config
for conf in /etc/nginx/sites-enabled/* /etc/nginx/conf.d/*.conf; do
    if [ -f "$conf" ]; then
        echo "=== Found config: $conf ==="
        cat "$conf"
        echo ""
    fi
done

echo ""
echo "======================================================"
echo "  Step 3: Check where portal files are served from"
echo "======================================================"
nginx -T 2>/dev/null | grep -E "root|server_name|listen" | head -20
