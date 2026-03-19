#!/bin/bash

# Install GUI libraries needed for Electron in WSL2
# Run this script to install missing GTK and other GUI dependencies

echo "Installing GUI libraries for Electron in WSL2..."

# Update package list
sudo apt update

# Install essential GUI libraries
sudo apt install -y \
    libgtk-3-0 \
    libgtk-3-dev \
    libgdk-pixbuf2.0-0 \
    libgdk-pixbuf2.0-dev \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libgdk-pixbuf-2.0-0

# Additional X11 libraries that might be needed
sudo apt install -y \
    xvfb \
    x11-apps \
    x11-xserver-utils

echo "GUI libraries installation complete!"
echo "You may need to configure your X11 server or enable WSLg to run Electron apps."
echo ""
echo "To test if GUI works, try running: xcalc"
echo "To run the Electron app: npm run electron"