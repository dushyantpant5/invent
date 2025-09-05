import { Home, LayoutDashboard, ShoppingBag, Package, LogOut, Settings } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

// Menu items.
const items = [
  {
    title: 'Inventory Name',
    url: '#',
    icon: Home,
  },
  {
    title: 'Dashboard',
    url: '#',
    icon: LayoutDashboard,
  },
  {
    title: 'Products',
    url: '#',
    icon: ShoppingBag,
  },
  {
    title: 'Orders',
    url: '#',
    icon: Package,
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  },
];

const footer = [
  {
    title: 'Logout',
    url: '#',
    icon: LogOut,
  },
];

export default function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <div className="p-2">
        <SidebarTrigger />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inventory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem key="User Prodile">
            <SidebarMenuButton asChild>
              <a href="#" className="flex items-center gap-2">
                <img src="/avatar.png" alt="User" className="w-4 h-4 rounded-full" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Harper Nelson</span>
                  <span className="text-xs text-gray-500">Admin Manager</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {footer.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
