import "./App.css";
import { useCallback, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

function App() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const handleSidebarEnter = useCallback(() => {
    setSidebarHoverOpen(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    setSidebarHoverOpen(false);
  }, []);

  return (
    <SidebarProvider open={sidebarHoverOpen} onOpenChange={setSidebarHoverOpen}>
      <div
        className="fixed inset-y-0 left-0 z-20 hidden w-3 md:block"
        onMouseEnter={handleSidebarEnter}
      />
      <AppSidebar
        side="left"
        collapsible="offcanvas"
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      />
      <SidebarInset>
        <div className="flex h-full justify-center pt-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold">Heute</h1>
            <p className="mt-2 text-base text-muted-foreground">
              {new Date().toLocaleDateString("de-DE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
