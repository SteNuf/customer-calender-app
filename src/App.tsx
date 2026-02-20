import "./App.css";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { NewDate } from "@/components/newDate";
import { NewCustomer } from "@/components/newCustomer";
import { SearchCustomer } from "@/components/searchCustomer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";

type Appointment = {
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
};

const STORAGE_KEY = "appointments";

function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  const loadAppointments = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setAppointments([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Appointment[];
      setAppointments(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAppointments([]);
    }
  };

  const deleteAppointment = (createdAt: string) => {
    const next = appointments.filter((item) => item.createdAt !== createdAt);
    setAppointments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  useEffect(() => {
    loadAppointments();

    const handleUpdated = () => {
      loadAppointments();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        loadAppointments();
      }
    };

    window.addEventListener("appointments:updated", handleUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("appointments:updated", handleUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
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
        <div className="mt-20 flex flex-col items-center gap-6">
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Termine</p>
          ) : null}
          {appointments.map((item, index) => (
            <Card
              key={`${item.createdAt}-${index}`}
              className="w-full max-w-700px cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-2">
                  <Badge className="inline-flex w-16 justify-center">
                    {item.startTime || "--:--"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="inline-flex w-16 justify-center"
                  >
                    {item.endTime || "--:--"}
                  </Badge>
                  <span className="inline-block w-40 text-left text-sm text-muted-foreground">
                    {item.title || "Termin"}
                  </span>
                  <Badge
                    variant="outline"
                    className="inline-flex w-28 justify-center"
                  >
                    {item.status || "offen"}
                  </Badge>
                  <button
                    type="button"
                    className="ml-3 rounded p-1 transition-colors hover:bg-muted"
                    onClick={() => {
                      navigate("/new-date", { state: { appointment: item } });
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
                    className="ml-4 rounded p-1 transition-colors hover:bg-muted"
                    onClick={() => {
                      deleteAppointment(item.createdAt);
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false);
  const handleSidebarEnter = useCallback(() => {
    setSidebarHoverOpen(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    setSidebarHoverOpen(false);
  }, []);
  const navigate = useNavigate();

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
        onNewDateClick={() => {
          navigate("/new-date");
        }}
        onNewCustomerClick={() => {
          navigate("/new-customer");
        }}
      />
      <SidebarInset>
        <HomePage />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
