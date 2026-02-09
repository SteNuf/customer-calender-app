import * as React from "react";

import { SearchForm } from "@/components/search-form";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="mt-8 gap-8 max-w-[12rem] w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
              onClick={() => {
                console.log("Hallo ich bin ein neuer Termin");
              }}
            >
              Neuer Termin
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
              onClick={() => {
                console.log("Ich bin ein neuer Kunde");
              }}
            >
              Neuer Kunde anlegen
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
