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
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '100vw', overflow: 'auto' }}>
          <h2 style={{ color: 'red' }}>🚨 App Crashed - Replace Error Detected</h2>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>Quick Fix Suggestions:</h3>
            <ul>
              <li>Check for <code>.replace()</code> calls on undefined strings</li>
              <li>Look for missing data in array mappings</li>
              <li>Verify API responses have expected properties</li>
              <li>Check route parameters and search params</li>
            </ul>
          </div>
          
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
          
          <div style={{ display: 'flex', gap: '10px' }}>
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
                  timestamp: new Date().toISOString()
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
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add global error handler for additional debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  console.log('Error source:', event.filename, 'Line:', event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Creating root...');
const root = createRoot(document.getElementById("root")!);

console.log('Rendering App...');
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
