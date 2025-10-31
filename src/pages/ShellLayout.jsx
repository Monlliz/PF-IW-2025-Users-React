import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { ShellBar, ShellBarItem, Button  } from '@ui5/webcomponents-react';
import { SideNavigation, SideNavigationItem, SideNavigationSubItem } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/nav-back.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/locate-me.js';
import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/account.js';
import '@ui5/webcomponents-icons/dist/menu2.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/role.js';
import '@ui5/webcomponents-icons/dist/private.js';

// 1. Importa tu archivo de CSS Modules
import styles from '../styles/ShellLayout.module.css';

export default function ShellLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSideNavSelection = (event) => {
    const key = event.detail.item.dataset.key;
    if (key) {
      navigate(key);
    }
  };

  return (
    <>
      <ShellBar
        primaryTitle="Usuarios"
        //secondaryTitle="Short description"
        onLogoClick={handleLogoClick}
        onMenuClick={() => setIsCollapsed(!isCollapsed)}
        logo={<img src="\img\logo.png" alt="SAP Logo" />}
        profile={<ShellBarItem icon="account" />}
        startButton={
          <Button
            icon="menu2"
            design="Transparent"
            onClick={() => setIsCollapsed(!isCollapsed)}
          />
        }
      >
        <ShellBarItem icon="search" text="Search"/>
      </ShellBar>

      {/* 2. Aplica la clase del contenedor principal */}
      <div className={styles.shellContainer}>
        <SideNavigation
          collapsed={isCollapsed}
          onSelectionChange={handleSideNavSelection}
          // fixedItems={
          //   <>
          //     <SideNavigationItem text="Fixed Item 1" icon="locate-me" data-key="/fixed1" />
          //     <SideNavigationItem text="Fixed Item 2" icon="locate-me" data-key="/fixed2" />
          //     <SideNavigationItem text="Fixed Item 3" icon="locate-me" data-key="/fixed3" />
          //   </>
          // }
          className={styles.sidNav}
        >
          {/* Item con sub-items */}
          <SideNavigationItem text="Gestión de Usuarios" icon="group" expanded>
            <SideNavigationSubItem text="Usuarios" data-key="/users" icon='employee'/>
            <SideNavigationSubItem text="Roles" data-key="/roles" icon='role'/>
            <SideNavigationSubItem text="Privilegios" data-key="/privileges" icon='private'/>
          </SideNavigationItem>

          {/* Items simples con flecha */}
          <SideNavigationItem text="Aplicaciones" icon="desktop-mobile" data-key="/apps" />
          <SideNavigationItem text="Procesos" data-key="/process" icon='process'/>
        </SideNavigation>
        {/* 3. Aplica la clase al contenedor del contenido */}
        <main className={styles.contentContainer}>
          <Outlet />
        </main>
      </div>
    </>
  );
}