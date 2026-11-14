import './shared/keepTyping'; // keep what people type when a screen is redrawn (same code in every Forka app)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/hub.css';
import App from './App';

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);
