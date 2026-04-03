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

  const primaryButtonClassName =
    "h-11 w-full cursor-pointer justify-center border border-input text-center hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <Sidebar {...props}>
      <SidebarContent className="items-center">
        <div className="w-full px-4 pt-4">
          {showBackButton ? (
            <SidebarMenu className="w-full">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={primaryButtonClassName}
                  onClick={() => {
                    onBackClick?.();
                  }}
                >
                  Zurück
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="h-11" aria-hidden="true" />
          )}

          {showActionButtons ? (
            <SidebarMenu className="mt-6 w-full gap-4 sm:gap-6">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={primaryButtonClassName}
                  onClick={() => {
                    onNewDateClick?.();
                  }}
                >
                  Neuer Termin
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={primaryButtonClassName}
                  onClick={() => {
                    onNewCustomerClick?.();
                  }}
                >
                  Neuer Kunde anlegen
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <div className="mt-6 h-26" aria-hidden="true" />
          )}
        </div>

        {showSearch ? (
          <div className="mt-6 w-full px-4">
            <SearchForm />
          </div>
        ) : null}

        <SidebarMenu className="mt-4 w-full px-4">
          <SidebarMenuItem>
            <SidebarMenuButton
              className={primaryButtonClassName}
              onClick={() => {
                onToggleAllAppointments?.();
              }}
            >
              {showAllAppointments ? "Heutige Termine" : "Alle Termine"}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {showAllCustomersButton ? (
          <SidebarMenu className="mt-4 w-full px-4">
            <SidebarMenuItem>
              <SidebarMenuButton
                className={primaryButtonClassName}
                onClick={() => {
                  onAllCustomersClick?.();
                }}
              >
                Alle Kunden
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : null}

        <div className="mt-auto w-full self-stretch pb-2">
          <SidebarMenu className="mb-4 w-full px-4">
            <SidebarMenuItem>
              <SidebarMenuButton
                className={primaryButtonClassName}
                onClick={() => {
                  setTheme(isDark ? "light" : "dark");
                }}
              >
                {isDark ? "Hellmodus" : "Dunkelmodus"}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mb-6 w-full px-2 sm:px-4">
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
