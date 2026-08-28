import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const DashboardLayout = ({ portalType = 'organization' }) => {
  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 flex flex-col font-sans">
      <Navbar portalType={portalType} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar portalType={portalType} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
