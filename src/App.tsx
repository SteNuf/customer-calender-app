import "./App.css";
import { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { NewDate } from "@/components/newDate";
import { NewCustomer } from "@/components/newCustomer";
import { SearchCustomer } from "@/components/searchCustomer";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

type Appointment = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string;
  createdAt: string;
};

type AppointmentRow = {
  id: number;
  created_at: string;
  grund: string | null;
  startzeitpkt: string | null;
  endzeitpkt: string | null;
  status: string | null;
  customer:
    | {
        vorname: string | null;
        name: string | null;
      }
    | {
        vorname: string | null;
        name: string | null;
      }[]
    | null;
};

const getCustomerName = (customer: AppointmentRow["customer"]) => {
  const customerData = Array.isArray(customer) ? customer[0] : customer;
  const firstName = customerData?.vorname?.trim() ?? "";
  const lastName = customerData?.name?.trim() ?? "";
  return `${firstName} ${lastName}`.trim();
};

const splitDateTime = (value: string | null) => {
  if (!value) {
    return { date: "", time: "" };
  }
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  return { date, time };
};

function HomePage({
  showAll,
  selectedDate,
}: {
  showAll: boolean;
  selectedDate?: Date;
}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  const loadAppointments = useCallback(async () => {
    let query = supabase
      .from("termine")
      .select(
        "id, created_at, grund, startzeitpkt, endzeitpkt, status, customer:customer_id (vorname, name)",
      )
      .order("startzeitpkt", {
        ascending: showAll && !selectedDate ? false : true,
      });

    if (selectedDate) {
      const startOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0,
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() + 1,
        0,
        0,
        0,
        0,
      );
      query = query
        .gte("startzeitpkt", startOfDay.toISOString())
        .lt("startzeitpkt", endOfDay.toISOString());
    } else if (showAll) {
      // No filter, show all appointments
    } else {
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0,
      );
      query = query
        .gte("startzeitpkt", startOfDay.toISOString())
        .lt("startzeitpkt", endOfDay.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to load appointments:", error.message);
      setAppointments([]);
      return;
    }

    const mapped = (data as AppointmentRow[]).map((row) => {
      const start = splitDateTime(row.startzeitpkt);
      const end = splitDateTime(row.endzeitpkt);
      return {
        id: row.id,
        title: row.grund ?? "",
        startDate: start.date,
        endDate: end.date,
        startTime: start.time,
        endTime: end.time,
        status: row.status ?? "",
        customerName: getCustomerName(row.customer),
        createdAt: row.created_at ?? "",
      };
    });
    setAppointments(mapped);
  }, [showAll, selectedDate]);

  const deleteAppointment = async (id: number) => {
    const ok = window.confirm("Möchten Sie den Termin wirklich löschen?");
    if (!ok) {
      return;
    }
    const { error } = await supabase.from("termine").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete appointment:", error.message);
      return;
    }
    await loadAppointments();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAppointments();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadAppointments]);

  const formatAppointmentDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("de-DE") : "--.--.----";

  const getReturnPath = () => {
    if (showAll && !selectedDate) {
      return "/?appointments=all";
    }
    if (selectedDate) {
      return `/?date=${selectedDate.toISOString().split("T")[0]}`;
    }
    return "/";
  };

  return (
    <div className="flex h-full justify-center px-4 pt-6 sm:px-6 sm:pt-8 md:px-8">
      <div className="w-full max-w-4xl text-center md:max-w-5xl lg:pl-6 xl:pl-8 2xl:pl-0">
        <h1 className="text-2xl font-semibold sm:text-4xl">
          {selectedDate
            ? selectedDate.toLocaleDateString("de-DE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : showAll
              ? "Alle Termine"
              : "Heute"}
        </h1>
        {!selectedDate && !showAll && (
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {new Date().toLocaleDateString("de-DE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center gap-4 sm:mt-12 sm:gap-6 md:gap-5">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {selectedDate ? "Keine Termine für diesen Tag" : "Keine Termine"}
            </p>
          ) : null}
          {appointments.map((item, index) => (
            <Card
              key={`${item.id}-${index}`}
              className="w-full cursor-pointer transition-shadow hover:shadow-md md:max-w-4xl"
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:hidden">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex justify-center">
                      <Badge
                        variant="outline"
                        className="inline-flex w-42 justify-center px-4 py-1 text-sm font-semibold tracking-wide"
                      >
                        {formatAppointmentDate(item.startDate)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Badge className="inline-flex w-20 justify-center px-3 py-1 text-sm font-medium">
                        {item.startTime || "--:--"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="inline-flex w-20 justify-center px-3 py-1 text-sm font-medium"
                      >
                        {item.endTime || "--:--"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title || "Termin"}
                    </p>
                    {showAll || selectedDate ? (
                      <div className="flex flex-col items-center gap-3.25">
                        <p className="text-sm text-muted-foreground">
                          {item.customerName || "Kein Kunde zugeordnet"}
                        </p>
                        <Badge
                          variant="outline"
                          className="inline-flex min-w-20 justify-center px-3 capitalize"
                        >
                          {item.status || "offen"}
                        </Badge>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="inline-flex min-w-20 justify-center px-3 capitalize sm:hidden"
                      >
                        {item.status || "offen"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      className="rounded p-1 transition-colors hover:bg-muted"
                      onClick={() => {
                        navigate("/new-date", {
                          state: {
                            appointmentId: item.id,
                            returnTo: getReturnPath(),
                          },
                        });
                      }}
                      aria-label="Bearbeiten"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 transition-colors hover:bg-muted"
                      onClick={() => {
                        deleteAppointment(item.id);
                      }}
                      aria-label="Löschen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5 text-red-600"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex sm:flex-col sm:gap-4 xl:hidden">
                  <div className="flex items-center justify-between gap-4">
                    <div className="w-32 shrink-0 text-left">
                      {showAll && !selectedDate ? (
                        <Badge
                          variant="outline"
                          className="inline-flex w-full justify-center"
                        >
                          {formatAppointmentDate(item.startDate)}
                        </Badge>
                      ) : (
                        <div />
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Badge className="inline-flex min-w-20 justify-center">
                        {item.startTime || "--:--"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="inline-flex min-w-20 justify-center"
                      >
                        {item.endTime || "--:--"}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-left text-sm font-medium text-foreground">
                    {item.title || "Termin"}
                  </p>
                  {showAll || selectedDate ? (
                    <p className="text-left text-sm text-muted-foreground">
                      {item.customerName || "Kein Kunde zugeordnet"}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex justify-start">
                      <Badge
                        variant="outline"
                        className="inline-flex min-w-20 justify-center px-3 capitalize"
                      >
                        {item.status || "offen"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded p-1 transition-colors hover:bg-muted"
                        onClick={() => {
                          navigate("/new-date", {
                            state: {
                              appointmentId: item.id,
                              returnTo: getReturnPath(),
                            },
                          });
                        }}
                        aria-label="Bearbeiten"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-5"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="rounded p-1 transition-colors hover:bg-muted"
                        onClick={() => {
                          deleteAppointment(item.id);
                        }}
                        aria-label="Löschen"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-5 text-red-600"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="hidden xl:flex xl:items-center xl:justify-between xl:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="w-28 shrink-0">
                      {showAll && !selectedDate ? (
                        <Badge
                          variant="outline"
                          className="inline-flex w-full justify-center"
                        >
                          {formatAppointmentDate(item.startDate)}
                        </Badge>
                      ) : null}
                    </div>
                    <Badge className="inline-flex min-w-16 justify-center">
                      {item.startTime || "--:--"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="inline-flex min-w-16 justify-center"
                    >
                      {item.endTime || "--:--"}
                    </Badge>
                    <div className="w-44 shrink-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.title || "Termin"}
                      </span>
                    </div>
                    <div className="w-48 shrink-0">
                      {showAll || selectedDate ? (
                        <span className="block truncate text-sm text-muted-foreground">
                          {item.customerName || "Kein Kunde zugeordnet"}
                        </span>
                      ) : null}
                    </div>
                    <div className="w-24 shrink-0">
                      <Badge
                        variant="outline"
                        className="inline-flex w-full justify-center capitalize"
                      >
                        {item.status || "offen"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded p-1 transition-colors hover:bg-muted"
                      onClick={() => {
                        navigate("/new-date", {
                          state: {
                            appointmentId: item.id,
                            returnTo: getReturnPath(),
                          },
                        });
                      }}
                      aria-label="Bearbeiten"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rounded p-1 transition-colors hover:bg-muted"
                      onClick={() => {
                        deleteAppointment(item.id);
                      }}
                      aria-label="Löschen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5 text-red-600"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
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

    setSelectedDate(selectedDateParam ? new Date(selectedDateParam) : undefined);
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

export default function App() {
  return (
    <BrowserRouter basename="/customer-calender-app">
      <Routes>
        <Route path="/" element={<AppLayout />} />
        <Route path="/new-date" element={<NewDate />} />
        <Route path="/new-customer" element={<NewCustomer />} />
        <Route path="/search-customer" element={<SearchCustomer />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
