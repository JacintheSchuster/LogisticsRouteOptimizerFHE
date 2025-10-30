import React from 'react';
import { FhevmProvider } from '@zama/fhevm-sdk/react';
import { LogisticsOptimizer } from './components/LogisticsOptimizer';
import './App.css';

function App() {
  return (
    <FhevmProvider chainId={11155111}>
      <div className="app-container">
        <LogisticsOptimizer />
      </div>
    </FhevmProvider>
  );
}

export default App;
