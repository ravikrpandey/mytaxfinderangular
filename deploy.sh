#!/bin/bash
# ============================================================
# MyTaxFinder — Ubuntu LightSail Deployment Script
# Deploys both Portal (/var/www/mytaxfinder/portal)
#          and Admin  (/var/www/mytaxfinder/admin)
# ============================================================

set -e  # Exit on any error

echo ""
echo "=============================================="
echo "  MyTaxFinder Deployment Script"
echo "=============================================="
echo ""

# ── STEP 1: Install Nginx if not present ───────────────────
echo "▶ Checking Nginx..."
if ! command -v nginx &> /dev/null; then
    echo "  Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
else
    echo "  Nginx already installed ✓"
fi

# ── STEP 2: Install Node.js (if not present) ───────────────
echo "▶ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "  Node.js $(node -v) already installed ✓"
fi

# ── STEP 3: Create web directories ─────────────────────────
echo "▶ Creating web directories..."
sudo mkdir -p /var/www/mytaxfinder/portal
sudo mkdir -p /var/www/mytaxfinder/adminpanel
sudo chown -R $USER:$USER /var/www/mytaxfinder

# ── STEP 4: Copy Nginx config ──────────────────────────────
echo "▶ Installing Nginx config..."
sudo cp nginx/mytaxfinder.conf /etc/nginx/sites-available/mytaxfinder
sudo ln -sf /etc/nginx/sites-available/mytaxfinder /etc/nginx/sites-enabled/mytaxfinder
# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# ── STEP 5: Validate Nginx config ──────────────────────────
echo "▶ Validating Nginx config..."
sudo nginx -t

# ── STEP 6: Build Portal (Angular 17) ─────────────────────
echo ""
echo "▶ Installing Portal dependencies..."
npm install

echo "▶ Building Portal (Angular 17)..."
npm run build:prod

echo "▶ Copying Portal build to /var/www/mytaxfinder/portal..."
cp -r dist/mytaxfinder/browser/* /var/www/mytaxfinder/portal/

# ── STEP 7: Build Admin (Angular 20) ──────────────────────
echo ""
echo "▶ Installing Admin dependencies..."
cd admin
npm install
cd ..

echo "▶ Building Admin (Angular 20) with --base-href /admin/..."
npm run admin:build:prod

echo "▶ Copying Admin build to /var/www/mytaxfinder/adminpanel..."
cp -r admin/dist/MyTaxFinder/* /var/www/mytaxfinder/adminpanel/ 2>/dev/null || \
cp -r admin/dist/my-tax-finder/* /var/www/mytaxfinder/adminpanel/ 2>/dev/null || \
cp -r admin/dist/*/*             /var/www/mytaxfinder/adminpanel/ 2>/dev/null || true

echo ""
echo "▶ Final folder structure:"
ls /var/www/mytaxfinder/portal    | head -5
echo "---"
ls /var/www/mytaxfinder/adminpanel | head -5

# ── STEP 8: Restart Nginx ──────────────────────────────────
echo ""
echo "▶ Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "=============================================="
echo "  ✅ Deployment Complete!"
echo "  Portal        → http://YOUR_DOMAIN_OR_IP/"
echo "  Portal Admin  → http://YOUR_DOMAIN_OR_IP/admin  (portal's built-in admin)"
echo "  New Admin App → http://YOUR_DOMAIN_OR_IP/adminpanel/"
echo "=============================================="
