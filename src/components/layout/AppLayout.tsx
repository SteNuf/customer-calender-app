import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HomePage } from "./HomePage";

export function AppLayout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showAllAppointments = searchParams.get("appointments") === "all";
  const selectedDateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    selectedDateParam ? new Date(selectedDateParam) : undefined,
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;
      navigate(`/?date=${dateString}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (showAllAppointments) {
      setSelectedDate(undefined);
      return;
    }

    setSelectedDate(
      selectedDateParam ? new Date(selectedDateParam) : undefined,
    );
  }, [selectedDateParam, showAllAppointments]);

  const handleToggleAllAppointments = () => {
    if (showAllAppointments) {
      setSelectedDate(undefined);
      navigate("/", { replace: true });
    } else {
      setSelectedDate(undefined);
      navigate("/?appointments=all", { replace: true });
    }
  };

  return (
    <SidebarProvider
      open={true}
      style={
        {
          "--sidebar-width": "min(22rem, 100vw)",
          "--sidebar-width-icon": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        side="left"
        collapsible="offcanvas"
        onNewDateClick={() => {
          navigate("/new-date");
        }}
        onNewCustomerClick={() => {
          navigate("/new-customer");
        }}
        onAllCustomersClick={() => {
          navigate("/search-customer");
        }}
        showAllAppointments={showAllAppointments}
        onToggleAllAppointments={handleToggleAllAppointments}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
        showBackButton={selectedDate !== undefined}
        onBackClick={() => {
          setSelectedDate(undefined);
          navigate("/", { replace: true });
        }}
      />
      <SidebarInset>
        <div className="sticky top-0 z-20 flex justify-start bg-background/95 px-4 py-3 backdrop-blur xl:hidden">
          <SidebarTrigger />
        </div>
        <HomePage showAll={showAllAppointments} selectedDate={selectedDate} />
      </SidebarInset>
    </SidebarProvider>
  );
}