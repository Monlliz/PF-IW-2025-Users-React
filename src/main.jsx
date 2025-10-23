import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route,Navigate } from 'react-router-dom';
//paginas
import ShellLayout from './pages/ShellLayout.jsx'
import Users from './pages/Users.jsx';
import Roles from './pages/Roles.jsx';
import Privileges from './pages/Privileges.jsx';
import Login from './pages/Login.jsx';
import Process from './pages/Process.jsx';
import Apps from './pages/Apps.jsx';

//css
//import './index.css';

// Importaciones de SAP UI5
import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/AllIcons.js'; // Importa todos los íconos

import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';




ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta de login - sin ShellLayout */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas que usan ShellLayout */}
          <Route path="/" element={<ShellLayout />}>
           {/* Rutas hijas que se renderizarán dentro del <Outlet /> */}
            <Route index element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="users" element={<Users />} />
            <Route path="privileges" element={<Privileges />} />
            <Route path="process" element={<Process />} />
            <Route path="apps" element={<Apps />} />
          </Route>
          
          {/* Ruta por defecto o redirección */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);