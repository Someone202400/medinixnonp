import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import './i18n' // COMMENTED OUT FOR TESTING

// Enhanced error boundary with more debugging info
class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log additional debugging info
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
    console.log('Component stack:', errorInfo.componentStack);
    
    // Log common error patterns
    if (error.message.includes('undefined') && error.message.includes('replace')) {
      console.log('🔍 DETECTED: Undefined string replace error - check data export or string operations');
    }
    
    if (error.message.includes('Cannot read properties')) {
      console.log('🔍 DETECTED: Property access error - check object null/undefined handling');
    }
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '100vw', overflow: 'auto' }}>
          <h2 style={{ color: 'red' }}>🚨 App Crashed - Error Detected</h2>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Quick Fix Suggestions:</h3>
            <ul>
              <li>Check for <code>.replace()</code> calls on undefined strings</li>
              <li>Look for missing data in array mappings</li>
              <li>Verify API responses have expected properties</li>
              <li>Check route parameters and search params</li>
              <li>Ensure proper null/undefined checking in data processing</li>
            </ul>
          </div>

          {/* Show specific error type suggestions */}
          {this.state.error?.message.includes('replace') && (
            <div style={{ backgroundColor: '#fff3cd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <h3>🔍 String Replace Error Detected:</h3>
              <p>This error typically occurs when trying to call .replace() on undefined. Common causes:</p>
              <ul>
                <li>API data not loaded yet</li>
                <li>Missing null checks in data processing</li>
                <li>Undefined values in CSV/data export functions</li>
              </ul>
            </div>
          )}
          
          <div style={{ backgroundColor: '#fff3cd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>🔍 Error Details:</h3>
            <p><strong>Type:</strong> {this.state.error?.name}</p>
            <p><strong>Message:</strong> {this.state.error?.message}</p>
          </div>
          
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 Full Stack Trace</summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              overflow: 'auto', 
              fontSize: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '3px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          
          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🧩 Component Stack</summary>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              overflow: 'auto', 
              fontSize: '12px',
              border: '1px solid #dee2e6',
              borderRadius: '3px'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🔄 Reload Page
            </button>
            <button 
              onClick={() => {
                console.log('Detailed error info:', {
                  error: this.state.error,
                  errorInfo: this.state.errorInfo,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                  url: window.location.href
                });
              }}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📝 Log Debug Info
            </button>
            <button 
              onClick={() => {
                // Clear localStorage to reset any corrupted state
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear Storage & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.log('Error source:', event.filename, 'Line:', event.lineno);
  
  // Log additional context for debugging
  console.log('Location:', window.location.href);
  console.log('User agent:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  console.log('Promise rejection at:', event.promise);
  console.log('Location:', window.location.href);
  console.log('Timestamp:', new Date().toISOString());
});

// Add a global flag to track if we're in development
const isDevelopment = import.meta.env.MODE === 'development';

console.log('Environment:', import.meta.env.MODE);
console.log('Creating root...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);
  
  console.log('Rendering App...');
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered with scope:', registration.scope);

        // Helper function to convert VAPID key
        function urlBase64ToUint8Array(base64String: string): Uint8Array {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
        
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        }

        // Subscribe user to Push
        const subscription = await registration.pushManager.getSubscription() 
          || await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BO7EJ9rVaGvhD1YGnBlN51V-f6v1adyU8zJ2-fnUfdb38hcY2y22Y85TUGWs13eiwzuVvtBlOEZ7RLTsBzCX7Kk'),
          });

        console.log('Push subscription:', subscription);

        // TODO: Send 'subscription' to your backend to save for sending push messages

      } catch (error) {
        console.error('Service Worker registration or push subscription failed:', error);
      }
    });
  }
  
} catch (error) {
  console.error('Failed to initialize React app:', error);
  
  // Show fallback error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; color: red;">
        <h2>🚨 Failed to Initialize App</h2>
        <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          🔄 Reload Page
        </button>
      </div>
    `;
  }
}
