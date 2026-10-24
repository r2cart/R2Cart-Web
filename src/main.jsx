import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import App from './App';
import './styles.css';
import './responsive.css';
import './app-theme.css';
import './upload.css';
import './account.css';
import { registerServiceWorker } from './services/pushNotification.service.js';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AppProvider><LanguageProvider><App/></LanguageProvider></AppProvider></BrowserRouter></React.StrictMode>);
