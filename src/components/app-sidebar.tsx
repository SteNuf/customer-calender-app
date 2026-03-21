import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import { SearchForm } from "@/components/search-form";
import { useTheme } from "next-themes";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  onNewDateClick?: () => void;
  showActionButtons?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSearch?: boolean;
  onNewCustomerClick?: () => void;
  showAllAppointments?: boolean;
  onToggleAllAppointments?: () => void;
  onAllCustomersClick?: () => void;
  showAllCustomersButton?: boolean;
  onDateSelect?: (date: Date | undefined) => void;
  selectedDate?: Date;
};

export function AppSidebar({
  onNewDateClick,
  showActionButtons = true,
  showBackButton = false,
  onBackClick,
  showSearch = true,
  onNewCustomerClick,
  showAllAppointments = false,
  onToggleAllAppointments,
  onAllCustomersClick,
  showAllCustomersButton = true,
  onDateSelect,
  selectedDate,
  ...props
}: AppSidebarProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark =
    (theme ?? resolvedTheme) === "dark" || resolvedTheme === "dark";

  return (
    <Sidebar {...props}>
      <SidebarContent className="items-center">
        {showBackButton ? (
          <SidebarMenu className="mt-4 w-73">
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
          <SidebarMenu className="mt-8 gap-8 w-73">
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
                  onNewCustomerClick?.();
                }}
              >
                Neuer Kunde anlegen
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        {showSearch ? (
          <div className="mt-6 w-73">
            <SearchForm />
          </div>
        ) : null}
        <SidebarMenu className="mt-4 w-73">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
              onClick={() => {
                onToggleAllAppointments?.();
              }}
            >
              {showAllAppointments ? "Heutige Termine" : "Alle Termine"}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {showAllCustomersButton ? (
          <SidebarMenu className="mt-4 w-73">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
                onClick={() => {
                  onAllCustomersClick?.();
                }}
              >
                Alle Kunden
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}
        <div className="mt-auto w-full pb-2 self-stretch">
          <SidebarMenu className="mb-4 w-73">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="justify-center text-center border border-input hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer w-full"
                onClick={() => {
                  setTheme(isDark ? "light" : "dark");
                }}
              >
                {isDark ? "Hellmodus" : "Dunkelmodus"}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mb-6 w-full">
            <Calendar
              selected={selectedDate}
              onSelect={onDateSelect}
              mode="single"
              className="w-full"
            />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
