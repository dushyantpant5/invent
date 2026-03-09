'use client';
import Navbar from '../../components/navbar';
import { useInventory } from '../../hooks/useInventory';

import { SidebarProvider } from '@/components/ui/sidebar';
// import { AppSidebar } from "@/components/app-sidebar"
export default function Dashboard() {
  const { currentInventory } = useInventory();
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <SidebarProvider>
        <Navbar />
      </SidebarProvider>
      <p className="text-lg">Welcome to your dashboard!</p>
      <h1>Inventory name:{currentInventory?.inventoryName}</h1>
    </div>
  );
}
