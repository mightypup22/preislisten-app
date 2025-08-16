import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

class ErrorBoundary extends React.Component<{children: React.ReactNode},{error: any}> {
  constructor(props:any){ super(props); this.state = { error: null } }
  static getDerivedStateFromError(error:any){ return { error } }
  render(){
    if (this.state.error) {
      return (
        <pre style={{ padding: 16, whiteSpace: 'pre-wrap', color: '#b91c1c', background: '#fff1f2' }}>
          <b>Render-Fehler:</b>{" "}
          {String(this.state.error?.message ?? this.state.error)}
        </pre>
      )
    }
    return this.props.children as any
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
