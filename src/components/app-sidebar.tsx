import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { SearchForm } from "@/components/search-form";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onNewDateClick?: () => void;
  showActionButtons?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSearch?: boolean;
};

export function AppSidebar({
  onNewDateClick,
  showActionButtons = true,
  showBackButton = false,
  onBackClick,
  showSearch = true,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent className="items-center">
        {showBackButton ? (
          <SidebarMenu className="mt-4 w-full max-w-[12rem]">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
                onClick={() => {
                  onBackClick?.();
                }}
              >
                Zurück
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        {showActionButtons ? (
          <SidebarMenu className="mt-8 gap-8 w-full max-w-[12rem]">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
                onClick={() => {
                  onNewDateClick?.();
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
        ) : null}
        {showSearch ? (
          <div className="mt-6 w-full max-w-[12rem]">
            <SearchForm />
          </div>
        ) : null}
        <div className="mt-auto mb-6 w-full pb-2 self-stretch">
          <Calendar className="w-full" />
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
