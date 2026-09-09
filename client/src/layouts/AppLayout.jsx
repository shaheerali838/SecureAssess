import React from 'react';
import { AppShell } from './components/AppShell';

export function AppLayout({ children, activeKey, layer }) {
  return (
    <AppShell activeKey={activeKey} layer={layer}>
      {children}
    </AppShell>
  );
}

export default AppLayout;
