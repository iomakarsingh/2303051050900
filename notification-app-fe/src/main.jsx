import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { bootstrapLogger } from './lib/logger'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
    },
    secondary: {
      main: '#f97316',
    },
    background: {
      default: '#f3f7fb',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'].join(','),
  },
  shape: {
    borderRadius: 18,
  },
})

bootstrapLogger()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
