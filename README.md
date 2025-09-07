# 🛡️ PayGuard AI - AI Shopping Agents with Smart Authorization

**EasyA x Algorand Harvard Hackathon Project**

PayGuard AI revolutionizes autonomous shopping with AI agents that can make purchases within authorized spending limits. Built on Algorand blockchain for instant finality and powered by GPT-4 for intelligent shopping decisions.

## 🔗 Live Blockchain Deployment

**🎯 Smart Contract:** [View on Pera Explorer](https://testnet.explorer.perawallet.app/application/745512518/)  
**👤 Creator Address:** [View Deployer Wallet](https://testnet.explorer.perawallet.app/address/HNXTBRFNCV7JFPLHH2MRFWFJ6NSGJ4RW4KCP7OUQ342A6D3DA3LZ22REFE/assets/0/)

*Application ID: 745512518 • Deployed on Algorand TestNet • Fully Functional*

## 🎯 Problem Statement

Parents want to give their kids shopping autonomy without losing control. Teams need shared budgets with smart approval flows. Current solutions lack the intelligence to shop effectively while maintaining security.

## 💡 Solution

PayGuard AI combines:
- **AI Shopping Agents** - GPT-4 powered agents that find the best products
- **Smart Authorization** - Auto-approve under limits, manual for larger amounts
- **Blockchain Security** - Algorand's instant finality ensures secure payments
- **Real-time Notifications** - Server-sent events for instant updates

## 🚀 Features

### AI Shopping Capabilities
- 🤖 GPT-4 powered product search and recommendations
- 💬 Natural language shopping conversations
- 🛍️ Smart budget-aware shopping decisions
- ⚡ One-click purchase requests

### Payment Authorization
- ✅ Auto-approval for purchases under spending limit
- 🔔 Real-time notifications for pending approvals
- 📊 Complete transaction history and analytics
- 💳 Multi-agent management with individual limits

### Blockchain Integration
- ⛓️ TEALScript smart contracts on Algorand
- 🔐 Pera Wallet integration
- ⚡ 2.8 second transaction finality
- 💰 Low transaction fees (~0.001 ALGO)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **AI**: OpenAI GPT-4, Function calling
- **Blockchain**: Algorand, TEALScript, AlgoKit 3.0
- **Database**: Turso (SQLite at the edge)
- **Real-time**: Server-Sent Events
- **Wallet**: Pera Wallet Connect

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/payguard-ai.git
cd payguard-ai

# Install Node 24
nvm install 24
nvm use 24

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your OpenAI API key to .env.local

# Initialize database
npm run dev
# Then visit http://localhost:3000/api/init

# Compile smart contracts
npm run contract:compile
```

## 🎮 Usage

1. **Connect Wallet**: Connect your Pera Wallet on the landing page
2. **Create Agent**: Click "Create AI Agent" and set a spending limit
3. **Start Shopping**: Click "Chat with Agent" to start shopping
4. **Find Products**: Ask the AI to find products (e.g., "Find me a gaming laptop")
5. **Make Purchases**: Click "Buy" on recommended products
6. **Approve Payments**: Check the Approvals tab for pending payments
7. **Track History**: View all transactions in the History tab

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (Next.js)            │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Wallet    │  │   AI Chat UI    │  │
│  │  Provider   │  │   Components    │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          API Routes (Next.js)           │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Agent     │  │    Payment      │  │
│  │ Management  │  │   Processing    │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
         │                    │
┌────────────────┐   ┌────────────────────┐
│   Turso DB     │   │   Algorand        │
│   (SQLite)     │   │   Blockchain      │
└────────────────┘   └────────────────────┘
```

## 📱 Demo Scenario

**Sarah's Shopping Assistant**
1. Sarah (parent) creates an AI agent with $100 limit for her daughter
2. Daughter asks AI: "Find me a good backpack for school"
3. AI recommends 3 options within budget
4. Daughter selects a $45 backpack (auto-approved)
5. Later, daughter tries to buy $80 headphones
6. Requires Sarah's manual approval
7. Sarah gets real-time notification and approves

## 🔑 Key Innovations

1. **AI-First Shopping** - First platform to combine GPT-4 with blockchain payments
2. **Smart Authorization** - Automatic approval logic based on spending limits
3. **Instant Finality** - Leveraging Algorand's 2.8 second blocks
4. **Real-time Updates** - SSE for instant notifications

## 📊 Smart Contract Methods

```typescript
createAgentWallet(agentId, spendingLimit)  // Create AI agent
requestPayment(amount, recipient, reason)   // Request payment
approvePayment(requestId)                   // Approve payment
setSpendingLimit(agentId, newLimit)        // Update limits
getAgentBalance(agentId)                    // Check balance
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Deploy smart contract
npm run contract:deploy
```

## 📝 Environment Variables

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your_auth_token

# Algorand
NEXT_PUBLIC_ALGORAND_NETWORK=testnet
NEXT_PUBLIC_APP_ID=your_app_id
```

## 🧪 Testing

```bash
# Run development server
npm run dev

# Test smart contract
npm run contract:test

# Build production
npm run build
```

## 🏆 Hackathon Highlights

- **100% TypeScript** - No Python, pure TypeScript stack
- **36 Hour Build** - Complete platform in hackathon timeframe
- **Working Demo** - Fully functional with real AI and blockchain
- **Instant Payments** - 2.8 second finality on Algorand

## 👥 Team

Built with ❤️ for the EasyA x Algorand Harvard Hackathon

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- EasyA for organizing the hackathon
- Algorand Foundation for blockchain infrastructure
- OpenAI for GPT-4 API
- Pera Wallet for wallet integration

---

**Demo Video**: [Link to video]  
**Live Demo**: [Link to deployed app]  
**Pitch Deck**: [Link to slides]