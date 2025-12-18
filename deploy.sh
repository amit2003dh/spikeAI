#!/bin/bash

# deploy.sh
echo "Starting deployment..."

# 1. Install dependencies
npm install

# 2. Start the server in the background using nohup
# We use 'node src/app.js' assuming your main file is there
nohup node src/app.js > app.log 2>&1 &

echo "Server started on port 8080"