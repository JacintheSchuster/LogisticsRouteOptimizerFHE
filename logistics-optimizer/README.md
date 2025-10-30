# 🚚 Logistics Route Optimizer - React + FHEVM SDK

A production-ready React application demonstrating privacy-preserving logistics route optimization using Zama's FHEVM SDK. Built with React, Vite, TypeScript, and fully integrated with `@zama/fhevm-sdk/react` hooks.

## 🌟 Core Concepts

### FHE-Powered Confidential Route Optimization
This platform leverages Fully Homomorphic Encryption (FHE) to perform route optimization calculations while keeping all sensitive logistics data encrypted. Delivery coordinates, priorities, vehicle capacities, and optimization results remain confidential throughout the entire computational process.

### Privacy-Preserving Delivery Path Planning
Traditional route optimization systems expose sensitive business information such as customer locations, delivery priorities, and operational patterns. Our solution ensures that:
- **Delivery coordinates remain encrypted** during optimization calculations
- **Route priorities are kept confidential** from unauthorized parties
- **Vehicle capacity and constraints** are processed without revealing operational details
- **Optimized routes are returned encrypted** to maintain end-to-end privacy

## 🚀 Key Features

### React + FHEVM SDK Integration
- **React 18 + Vite**: Modern development stack with fast HMR
- **FHEVM SDK Hooks**: Full integration with `useFhevm()`, `useEncrypt()`, `useDecrypt()`
- **TypeScript**: Type-safe development with full autocomplete
- **Component Architecture**: Modular, maintainable component structure

### Privacy-Preserving Features
- **Confidential Route Optimization**: Submit encrypted delivery locations and receive optimized routes
- **Privacy-First Architecture**: All calculations performed on encrypted data using FHE technology
- **Multi-Constraint Optimization**: Support for vehicle capacity, distance limits, and delivery priorities
- **Real-time Processing**: Efficient route optimization with encrypted computation
- **Blockchain Integration**: Immutable record of optimization requests and results
- **Modern UI**: Responsive design with dynamic gradient backgrounds

## 🔐 Privacy Benefits

- **Data Confidentiality**: Customer locations and delivery details remain private
- **Competitive Advantage Protection**: Route strategies and operational patterns stay confidential
- **Regulatory Compliance**: Enhanced privacy protection for sensitive logistics data
- **Zero-Knowledge Optimization**: Route calculations without revealing underlying data

## 📱 Application Scenarios

- **Last-Mile Delivery**: Optimize delivery routes while protecting customer privacy
- **Supply Chain Management**: Confidential warehouse-to-retailer logistics planning
- **Emergency Services**: Private route optimization for sensitive emergency responses
- **Corporate Logistics**: Protect proprietary delivery strategies and customer data

## 🛠 Technical Architecture

### Technology Stack
- **Frontend**: React 18 + Vite
- **SDK**: @zama/fhevm-sdk (React hooks)
- **Blockchain**: Ethers.js v6
- **Language**: TypeScript
- **Styling**: CSS with CSS variables
- **Smart Contracts**: Solidity contracts with FHE operations
- **Encryption**: Fully Homomorphic Encryption for confidential computation
- **Network**: Sepolia Testnet

### Component Structure

```
src/
├── components/
│   ├── LogisticsOptimizer.tsx    # Main application component
│   ├── WalletConnection.tsx      # MetaMask wallet connection
│   ├── RouteRequestForm.tsx      # Route optimization request form
│   ├── RouteList.tsx             # Display user routes
│   └── RouteDetails.tsx          # Route visualization
├── App.tsx                       # Root component with FhevmProvider
├── main.tsx                      # React entry point
├── App.css                       # Application styles
└── index.css                     # Global styles
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Sepolia testnet ETH

### Installation

```bash
# Navigate to the project
cd examples/logistics-optimizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📚 FHEVM SDK Integration

### 1. Provider Setup

```typescript
// src/App.tsx
import { FhevmProvider } from '@zama/fhevm-sdk/react';

function App() {
  return (
    <FhevmProvider chainId={11155111}>
      <LogisticsOptimizer />
    </FhevmProvider>
  );
}
```

### 2. Using FHEVM Hooks

```typescript
// src/components/LogisticsOptimizer.tsx
import { useFhevm, useEncrypt, useDecrypt } from '@zama/fhevm-sdk/react';

export const LogisticsOptimizer: React.FC = () => {
  // Check if FHEVM is ready
  const { isReady, error } = useFhevm();

  // Encryption hooks
  const { encrypt32, encrypt8, isEncrypting } = useEncrypt();

  // Decryption hooks
  const { decrypt64, isDecrypting } = useDecrypt();

  // Use in your application logic
  const submitRoute = async () => {
    const encrypted = await encrypt32(1000);
    // Use encrypted value in contract call
  };
};
```

### 3. Available Hooks

#### `useFhevm()`
Returns FHEVM SDK status and configuration

#### `useEncrypt()`
Provides encryption functions for different data types

#### `useDecrypt()`
Provides decryption functions for encrypted results

## 🌐 Live Demo

**Website**: [https://logistics-route-optimizer.vercel.app/](https://logistics-route-optimizer.vercel.app/)

**Contract Address**: `0x1AACA0ce21752dE30E0EB927169084b84d290B87`

## 📹 Demo Materials

### LogisticsRouteOptimizer.mp4
Our platform includes comprehensive video demonstrations showing:
- Route optimization request workflow
- Privacy-preserving calculation process
- Encrypted result retrieval and visualization
- Administrative route processing features

### LogisticsRouteOptimizer.png
The repository contains detailed screenshots of:
- Smart contract deployment transactions
- Route optimization request transactions
- Route processing and result generation
- Encrypted data handling on blockchain

## 💡 How It Works

1. **Submit Route Request**: Input delivery locations, priorities, and constraints through the encrypted interface
2. **FHE Processing**: The system performs route optimization calculations on encrypted data
3. **Receive Results**: Get optimized routes and timing estimates while maintaining data privacy
4. **Execute Delivery**: Use the optimized route for efficient, private logistics operations

## 🔗 Repository

**GitHub**: [https://github.com/JacintheSchuster/LogisticsRouteOptimizer](https://github.com/JacintheSchuster/LogisticsRouteOptimizer)

## 🏆 Innovation Impact

This project represents a significant advancement in logistics technology by combining:
- **Cutting-edge FHE technology** for practical logistics applications
- **Real-world privacy needs** in competitive logistics markets
- **Blockchain immutability** with confidential computation
- **User-friendly interfaces** for mainstream adoption

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

We welcome contributions to enhance the privacy-preserving logistics optimization ecosystem. Please refer to our contribution guidelines in the repository.

---

*Revolutionizing logistics through privacy-preserving route optimization technology*