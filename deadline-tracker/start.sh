#!/usr/bin/env bash
#
# start.sh - ONE COMMAND to launch the complete Deadline Tracker demo:
#   1. makes sure MySQL is running
#   2. starts the PHP app (php -S) on PHP_PORT
#   3. starts the React demo (vite) on REACT_PORT, installing deps if needed
#   4. waits until both are actually responding (not just "started")
#   5. prints the two localhost links clearly, and opens them in the browser
#
# Usage:
#   ./start.sh          start everything for the demo
#   ./start.sh stop     stop the servers this script started

set -uo pipefail

PHP_PORT=8089
REACT_PORT=5173
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$PROJECT_DIR/.run"
PHP_PID_FILE="$RUN_DIR/php.pid"
REACT_PID_FILE="$RUN_DIR/react.pid"

BOLD="\033[1m"; GREEN="\033[32m"; RED="\033[31m"; CYAN="\033[36m"; RESET="\033[0m"

port_in_use() {
    lsof -i ":$1" -sTCP:LISTEN >/dev/null 2>&1
}

# wait_for_http URL MAX_SECONDS - polls a URL until it returns any HTTP
# response, so we never report "started" before it can actually serve
# a page (avoids a dead link appearing on screen during the demo).
wait_for_http() {
    local url="$1" max="$2" waited=0
    while [ "$waited" -lt "$max" ]; do
        if curl -s -o /dev/null --max-time 2 "$url"; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    return 1
}

stop_servers() {
    for pidfile in "$PHP_PID_FILE" "$REACT_PID_FILE"; do
        if [ -f "$pidfile" ]; then
            pid="$(cat "$pidfile")"
            if kill -0 "$pid" >/dev/null 2>&1; then
                kill "$pid" 2>/dev/null || true
                echo "Stopped process $pid ($(basename "$pidfile" .pid))"
            fi
            rm -f "$pidfile"
        fi
    done
}

if [ "${1:-}" = "stop" ]; then
    stop_servers
    exit 0
fi

mkdir -p "$RUN_DIR"

echo -e "${BOLD}Starting Deadline Tracker demo...${RESET}"
echo

# ---- 1. MySQL ----------------------------------------------------
echo "==> [1/3] Database (MySQL)..."
if command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep -q "^mysql.*started"; then
    echo "    already running."
elif command -v brew >/dev/null 2>&1; then
    echo "    starting via brew services..."
    brew services start mysql >/dev/null 2>&1
    sleep 3
else
    echo "    could not verify via brew - make sure MySQL is running manually."
fi

# ---- 2. PHP application -------------------------------------------
echo "==> [2/3] Backend (PHP app on port $PHP_PORT)..."
if port_in_use "$PHP_PORT"; then
    echo "    already running."
else
    (cd "$PROJECT_DIR" && nohup php -S "localhost:$PHP_PORT" > "$RUN_DIR/php.log" 2>&1 &)
    pgrep -f "php -S localhost:$PHP_PORT" | head -1 > "$PHP_PID_FILE"
fi
PHP_URL="http://localhost:$PHP_PORT/index.php"
if wait_for_http "$PHP_URL" 10; then
    echo -e "    ${GREEN}ready.${RESET}"
else
    echo -e "    ${RED}did not respond in time - check $RUN_DIR/php.log${RESET}"
fi

# ---- 3. React demo --------------------------------------------------
echo "==> [3/3] Frontend demo (React on port $REACT_PORT)..."
REACT_DIR="$PROJECT_DIR/react-demo"
if port_in_use "$REACT_PORT"; then
    echo "    already running."
else
    if [ ! -d "$REACT_DIR/node_modules" ]; then
        echo "    installing dependencies (first run only)..."
        (cd "$REACT_DIR" && npm install --silent)
    fi
    (cd "$REACT_DIR" && nohup npm run dev -- --port "$REACT_PORT" > "$RUN_DIR/react.log" 2>&1 &)
    pgrep -f "vite.*--port $REACT_PORT" | head -1 > "$REACT_PID_FILE"
fi
REACT_URL="http://localhost:$REACT_PORT/"
if wait_for_http "$REACT_URL" 15; then
    echo -e "    ${GREEN}ready.${RESET}"
else
    echo -e "    ${RED}did not respond in time - check $RUN_DIR/react.log${RESET}"
fi

# ---- 4. Open in browser + print the links clearly -------------------
echo
echo -e "${BOLD}============================================================${RESET}"
echo -e "${BOLD}  Deadline Tracker is ready for the demo${RESET}"
echo -e "${BOLD}============================================================${RESET}"
echo
echo -e "  Main app (PHP + MySQL) : ${CYAN}${BOLD}$PHP_URL${RESET}"
echo -e "  React demo             : ${CYAN}${BOLD}$REACT_URL${RESET}"
echo
echo -e "${BOLD}============================================================${RESET}"
echo
echo "  Opening both in your browser now..."

if command -v open >/dev/null 2>&1; then
    open "$PHP_URL"
    sleep 1
    open "$REACT_URL"
fi

echo
echo "  When you're done, stop everything with:  ./start.sh stop"
echo
