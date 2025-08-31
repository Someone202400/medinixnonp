import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n.ts";

// Register service worker with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Request notification permission gracefully
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then((permission) => {
            console.log('Notification permission:', permission);
          }).catch((error) => {
            console.log('Notification permission error:', error);
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = document.getElementById("root")!;

createRoot(root).render(<App />);
