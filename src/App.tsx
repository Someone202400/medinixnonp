import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Temporarily remove problematic imports
const App = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug Mode - App is Working!</h1>
      <p>If you see this, the basic app structure is fine.</p>
      <p>The issue is likely in one of the context providers or imported utilities.</p>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<div>Home page working!</div>} />
          <Route path="/login" element={<div>Login page working!</div>} />
          <Route path="*" element={<div>404 - Page not found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
