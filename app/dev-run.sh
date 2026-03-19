#!/bin/bash

# WritersLife Frontend Development Runner
# Usage: ./dev-run.sh [browser|electron]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_usage() {
    echo -e "${BLUE}Usage: ./dev-run.sh [browser|electron]${NC}"
    echo ""
    echo "Options:"
    echo "  browser   - Run React app in browser (default)"
    echo "  electron  - Run as Electron desktop app"
    echo ""
}

run_browser() {
    echo -e "${GREEN}🌐 Starting WritersLife in browser mode...${NC}"
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${YELLOW}Starting development server...${NC}"
    npm start
}

run_electron() {
    echo -e "${GREEN}⚡ Starting WritersLife as Electron desktop app...${NC}"
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}Building React app...${NC}"
    npm run build
    
    echo -e "${YELLOW}Launching Electron app...${NC}"
    npm run electron
}

run_electron_dev() {
    echo -e "${GREEN}⚡ Starting WritersLife in Electron development mode...${NC}"
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}Starting React dev server...${NC}"
    echo -e "${BLUE}In another terminal, run: ELECTRON_START_URL=http://localhost:3000 npm run electron${NC}"
    echo -e "${BLUE}Or use the electron-dev option: ./dev-run.sh electron-dev${NC}"
    npm start
}

run_electron_dev_auto() {
    echo -e "${GREEN}⚡ Starting WritersLife in Electron development mode (auto)...${NC}"
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    
    echo -e "${YELLOW}Starting React dev server and Electron...${NC}"
    # Start React dev server in background
    npm start &
    REACT_PID=$!
    
    # Wait for React server to be ready
    echo -e "${YELLOW}Waiting for React dev server to start...${NC}"
    sleep 5
    
    # Start Electron with dev server URL
    ELECTRON_START_URL=http://localhost:3000 npm run electron
    
    # Clean up React process when Electron closes
    kill $REACT_PID 2>/dev/null || true
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Make sure you're in the app directory.${NC}"
    exit 1
fi

# Parse command line arguments
case "${1:-browser}" in
    "browser")
        run_browser
        ;;
    "electron")
        run_electron
        ;;
    "electron-dev")
        run_electron_dev_auto
        ;;
    "help"|"-h"|"--help")
        print_usage
        ;;
    *)
        echo -e "${RED}Error: Unknown option '${1}'${NC}"
        print_usage
        exit 1
        ;;
esac