import "./App.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

function App() {
  return (
    <SidebarProvider>
      <AppSidebar side="left" collapsible="none" />
      <SidebarInset>
        <div className="p-6">Test</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
