import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Box, Typography } from '@mui/material';
import App from './App.jsx';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {PUBLISHABLE_KEY ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      ) : (
        <Box sx={{ p: 4, mt: 10, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Missing Clerk Configuration
          </Typography>
          <Typography>
            Please add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to your <code>frontend/.env</code> file.
          </Typography>
        </Box>
      )}
    </BrowserRouter>
  </React.StrictMode>,
);
