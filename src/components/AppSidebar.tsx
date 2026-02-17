import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Factory,
  Truck,
  CheckCircle2,
  ShieldCheck,
  FolderOpen,
  TreePine,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Projektübersicht", url: "/", icon: FolderKanban },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AVOR", url: "/avor", icon: ClipboardList },
  { title: "Produktion", url: "/produktion", icon: Factory },
  { title: "Montage", url: "/montage", icon: Truck },
  { title: "Fertigstellung", url: "/fertigstellung", icon: CheckCircle2 },
  { title: "QM / Qualität", url: "/qm", icon: ShieldCheck },
  { title: "Dateiablage", url: "/dateiablage", icon: FolderOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && <span className="text-base font-bold tracking-tight text-sidebar-foreground">HolzbauPlus</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
