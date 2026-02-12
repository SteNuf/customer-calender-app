import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function NewDate() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("Auswählen");
  const [errors, setErrors] = useState({
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    status: "",
  });
  const handleSidebarEnter = useCallback(() => {
    setSidebarHoverOpen(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    setSidebarHoverOpen(false);
  }, []);
  const navigate = useNavigate();

  const validateRequired = () => {
    const nextErrors = {
      title: title.trim().length === 0 ? "Bitte Titel eingeben." : "",
      startDate: !startDate ? "Bitte Startdatum wählen." : "",
      endDate: !endDate ? "Bitte Enddatum wählen." : "",
      startTime: !startTime ? "Bitte Startzeit wählen." : "",
      endTime: !endTime ? "Bitte Endzeit wählen." : "",
      status: status === "Auswählen" ? "Bitte Status wählen." : "",
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === "");
  };

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setStatus("Auswählen");
    setErrors({
      title: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      status: "",
    });
  };

  const saveAppointment = () => {
    const appointment: Appointment = {
      title: title.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      status,
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as Appointment[]) : [];
      list.push(appointment);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([appointment]));
    }

    window.dispatchEvent(new Event("appointments:updated"));
  };

  const toDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`);
  };

  const isEndBeforeStart = () => {
    const start = toDateTime(startDate, startTime);
    const end = toDateTime(endDate, endTime);
    return Number.isFinite(start.getTime()) &&
      Number.isFinite(end.getTime()) &&
      end <= start;
  };

  const hasOverlap = () => {
    const newStart = toDateTime(startDate, startTime);
    const newEnd = toDateTime(endDate, endTime);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? (JSON.parse(raw) as Appointment[]) : [];
      return list.some((item) => {
        const existingStart = toDateTime(item.startDate, item.startTime);
        const existingEnd = toDateTime(item.endDate, item.endTime);
        return newStart < existingEnd && newEnd > existingStart;
      });
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        window.dispatchEvent(new Event("appointments:updated"));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <SidebarProvider
      open={sidebarHoverOpen}
      onOpenChange={setSidebarHoverOpen}
      style={{ "--sidebar-width": "720px" } as React.CSSProperties}
    >
      <div
        className="fixed inset-y-0 left-0 z-20 hidden w-3 md:block"
        onMouseEnter={handleSidebarEnter}
      />
      <AppSidebar
        side="left"
        collapsible="offcanvas"
        showActionButtons={false}
        showBackButton
        showSearch={false}
        onBackClick={() => {
          navigate("/");
        }}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      />
      <SidebarInset>
        <main className="min-h-screen w-full">
          <div className="px-6 py-12">
            <div className="mx-auto w-full max-w-md text-left">
              <h1 className="text-3xl font-semibold text-center">
                Neuer Termin
              </h1>
              <div className="mt-20">
                <input
                  type="text"
                  placeholder="Text eingeben..."
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                  className="w-full rounded-md border border-input bg-background px-4 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.title ? (
                  <p className="mt-2 text-sm text-red-600">{errors.title}</p>
                ) : null}
                <div className="mt-6 flex items-center gap-2 text-xl text-muted-foreground">
                  <span>Datum:</span>
                  <input
                    type="date"
                    aria-label="Startdatum"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                    }}
                    className="h-8 rounded-md border border-input bg-secondary px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>bis</span>
                  <input
                    type="date"
                    aria-label="Enddatum"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                    }}
                    className="h-8 rounded-md border border-input bg-secondary px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {errors.startDate || errors.endDate ? (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.startDate || errors.endDate}
                  </p>
                ) : null}
                <div className="mt-5 flex items-center gap-2 text-xl text-muted-foreground">
                  <span>Uhrzeit:</span>
                  <input
                    type="time"
                    aria-label="Startzeit"
                    value={startTime}
                    onChange={(event) => {
                      setStartTime(event.target.value);
                    }}
                    className="h-8 rounded-md border border-input bg-secondary px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>bis</span>
                  <input
                    type="time"
                    aria-label="Endzeit"
                    value={endTime}
                    onChange={(event) => {
                      setEndTime(event.target.value);
                    }}
                    className="h-8 rounded-md border border-input bg-secondary px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {errors.startTime || errors.endTime ? (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.startTime || errors.endTime}
                  </p>
                ) : null}
                <div className="mt-5 flex items-center gap-2 text-xl text-muted-foreground">
                  <span>Status:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {status}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onSelect={() => {
                          setStatus("Offen");
                        }}
                      >
                        Offen
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setStatus("Geplant");
                        }}
                      >
                        Geplant
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setStatus("Abgeschlossen");
                        }}
                      >
                        Abgeschlossen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {errors.status ? (
                  <p className="mt-2 text-sm text-red-600">{errors.status}</p>
                ) : null}
                <div className="mt-12 flex items-center gap-3">
                  <Button
                    variant="default"
                    onClick={() => {
                      if (!validateRequired()) {
                        return;
                      }
                      if (isEndBeforeStart()) {
                        toast.error(
                          "Endzeit darf nicht vor der Startzeit liegen.",
                          { duration: 6000 }
                        );
                        return;
                      }
                      if (hasOverlap()) {
                        toast.error(
                          "In diesem Zeitraum liegt schon ein Termin.",
                          { duration: 6000 }
                        );
                        return;
                      }
                      saveAppointment();
                      resetForm();
                      console.log(
                        "Der Termin ist angelegt. Sie werden zum Kunden anlegen weitergeleitet."
                      );
                      toast(
                        "Der Termin ist im Kalender gespeichert und Sie werden zum Kunden anlegen weitergeleitet."
                      );
                    }}
                  >
                    Speichern + Neuer Kunde anlegen
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!validateRequired()) {
                        return;
                      }
                      if (isEndBeforeStart()) {
                        toast.error(
                          "Endzeit darf nicht vor der Startzeit liegen.",
                          { duration: 6000 }
                        );
                        return;
                      }
                      if (hasOverlap()) {
                        toast.error(
                          "In diesem Zeitraum liegt schon ein Termin.",
                          { duration: 6000 }
                        );
                        return;
                      }
                      saveAppointment();
                      resetForm();
                      console.log("Der Termin ist im Kalender gespeichert.");
                      toast("Der Termin ist im Kalender gespeichert.");
                    }}
                  >
                    Speichern
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      console.log("Der Vorgang ist abgebrochen.");
                      toast("Der Vorgang ist abgebrochen.");
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
