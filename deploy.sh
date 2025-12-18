
# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Start the server in the background
# We use 'nohup' so it keeps running after the script finishes
echo "🚀 Starting Server..."
nohup node src/app.js > app.log 2>&1 &

# 3. Wait a few seconds to ensure it starts
sleep 3

echo "✅ Deployment Complete. Server running on port 8080."