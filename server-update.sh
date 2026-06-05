#!/bin/bash
# ================================================================
# MyTaxFinder — Server Update Script
# Run this on your Ubuntu LightSail server after SSH-ing in:
#   ssh -i "your-key.pem" ubuntu@YOUR_SERVER_IP
#   bash server-update.sh
# ================================================================

set -e
echo ""
echo "======================================================"
echo "  MyTaxFinder Server Update"
echo "======================================================"

# ── Where is your project on the server? ─────────────────────
# Change this to the actual path of your project on the server
PROJECT_DIR=~/mytaxfinderangular    # <-- update if different

cd $PROJECT_DIR

# ── STEP 1: Pull latest code ──────────────────────────────────
echo ""
echo "▶ [1/7] Pulling latest code from GitHub..."
git pull origin admin

# ── STEP 2: Install Node.js 20 if missing ────────────────────
echo ""
echo "▶ [2/7] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "  Node.js $(node -v) found ✓"
fi

# ── STEP 3: Install Angular CLI globally if missing ──────────
echo ""
echo "▶ [3/7] Checking Angular CLI..."
if ! command -v ng &> /dev/null; then
    echo "  Installing Angular CLI..."
    sudo npm install -g @angular/cli
else
    echo "  Angular CLI found ✓"
fi

# ── STEP 4: Install dependencies ─────────────────────────────
echo ""
echo "▶ [4/7] Installing portal dependencies..."
npm install --legacy-peer-deps

echo ""
echo "▶ [4/7] Installing admin dependencies..."
cd admin && npm install && cd ..

# ── STEP 5: Build both apps ───────────────────────────────────
echo ""
echo "▶ [5/7] Building Portal (Angular 17)..."
npm run build:prod

echo ""
echo "▶ [5/7] Building Admin (Angular 20) with base-href /adminpanel/..."
npm run admin:build:prod

# ── STEP 6: Copy builds to web root ──────────────────────────
echo ""
echo "▶ [6/7] Deploying to /var/www/mytaxfinder/..."
sudo mkdir -p /var/www/mytaxfinder/portal
sudo mkdir -p /var/www/mytaxfinder/adminpanel
sudo chown -R $USER:$USER /var/www/mytaxfinder

# Portal — Angular 17 outputs directly (no browser/ subfolder)
if [ -d "dist/mytaxfinder/browser" ]; then
    cp -r dist/mytaxfinder/browser/* /var/www/mytaxfinder/portal/
else
    cp -r dist/mytaxfinder/* /var/www/mytaxfinder/portal/
fi

# Admin — Angular 20 outputs to browser/ subfolder
if [ -d "admin/dist/MyTaxFinder/browser" ]; then
    cp -r admin/dist/MyTaxFinder/browser/* /var/www/mytaxfinder/adminpanel/
elif [ -d "admin/dist/my-tax-finder/browser" ]; then
    cp -r admin/dist/my-tax-finder/browser/* /var/www/mytaxfinder/adminpanel/
else
    cp -r admin/dist/*/*/* /var/www/mytaxfinder/adminpanel/ 2>/dev/null || \
    cp -r admin/dist/*/* /var/www/mytaxfinder/adminpanel/
fi

# ── STEP 7: Setup Nginx ───────────────────────────────────────
echo ""
echo "▶ [7/7] Configuring Nginx..."
sudo cp nginx/mytaxfinder.conf /etc/nginx/sites-available/mytaxfinder
sudo ln -sf /etc/nginx/sites-available/mytaxfinder /etc/nginx/sites-enabled/mytaxfinder
sudo rm -f /etc/nginx/sites-enabled/default

echo ""
echo "▶ Testing Nginx config..."
sudo nginx -t

echo ""
echo "▶ Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  ✅ Deployment Complete!"
echo ""
echo "  Portal        → http://YOUR_DOMAIN/"
echo "  Portal Admin  → http://YOUR_DOMAIN/admin      (portal's own admin)"
echo "  New Admin App → http://YOUR_DOMAIN/adminpanel/"
echo "======================================================"
echo ""
echo "  Quick test:"
echo "  curl -o /dev/null -s -w '%{http_code}' http://localhost/             # should be 200"
echo "  curl -o /dev/null -s -w '%{http_code}' http://localhost/adminpanel/  # should be 200"
echo ""
