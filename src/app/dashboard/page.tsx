import Navbar from '../../components/navbar';

import { SidebarProvider } from '@/components/ui/sidebar';
// import { AppSidebar } from "@/components/app-sidebar"

export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <SidebarProvider>
        <Navbar />
      </SidebarProvider>
      <p className="text-lg">Welcome to your dashboard!</p>
    </div>
  );
}
