import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedData } from './utils/seedData'
import { initializePendo } from './utils/pendoInit'

// Expose seed function for development
declare global {
  interface Window {
    seedData: () => void;
  }
}
window.seedData = seedData;

// Initialize Pendo analytics with visitor metadata
initializePendo();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
