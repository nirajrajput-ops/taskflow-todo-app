import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedData } from './utils/seedData'

// Expose seed function for development
declare global {
  interface Window {
    seedData: () => void;
  }
}
window.seedData = seedData;

// Start Pendo once, before the app renders; the agent itself is loaded by the
// snippet in index.html. An empty visitor id lets Pendo reuse a returning
// visitor's anonymous id or create a new one.
if (typeof pendo !== 'undefined') {
  pendo.initialize({
    visitor: {
      id: '',
    },
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
