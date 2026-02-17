import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { projekte } from "@/data/mockData";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <Select defaultValue="1">
              <SelectTrigger className="w-[320px] border-0 bg-transparent font-medium shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projekte.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nummer} – {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
