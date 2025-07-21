# Logistics Route Optimizer

Privacy-preserving logistics route optimization using Fully Homomorphic Encryption (FHEVM) on Ethereum Sepolia.

## 🚀 Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **wagmi** for Ethereum interactions
- **RainbowKit** for wallet connection
- **Tailwind CSS** + **Radix UI** for styling
- **Loading states** and error handling
- **Transaction history** tracking
- **Vercel** ready deployment

## 📦 Contract

- **Address**: `0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8`
- **Network**: Sepolia Testnet
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0xE235A5C0DbF47ba76db3912c80267F9B43B8d1a8)

## 🛠️ Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your WalletConnect Project ID to .env.local
\`\`\`

## 🏃 Development

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Lint
npm run lint
\`\`\`

## 📁 Project Structure

\`\`\`
logistics-optimizer/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── providers.tsx      # Web3 providers
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI components (Radix)
│   ├── RouteForm.tsx     # Route optimization form
│   ├── RouteList.tsx     # User routes display
│   └── TransactionHistory.tsx # TX history
├── lib/                   # Utilities
│   ├── wagmi.ts          # wagmi configuration
│   ├── contract.ts       # Contract ABI & address
│   └── utils.ts          # Helper functions
└── public/               # Static files
\`\`\`

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

\`\`\`bash
# Or use Vercel CLI
npm i -g vercel
vercel
\`\`\`

## 🔐 Environment Variables

Required in `.env.local`:

\`\`\`env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
\`\`\`

Get your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## 📄 License

MIT
