import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Appointment = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
};

const toTimestampString = (date: string, time: string) => {
  if (!date || !time) {
    return "";
  }
  return `${date}T${time}:00`;
};

export function NewDate() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("Auswählen");
  const [prefilled, setPrefilled] = useState(false);
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
  const location = useLocation();
  const editingAppointment = (
    location.state as { appointment?: Appointment } | null
  )?.appointment;
  const appointmentIdFromState = (
    location.state as { appointmentId?: number } | null
  )?.appointmentId;
  const editingAppointmentId =
    editingAppointment?.id ?? appointmentIdFromState ?? null;

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

  const saveAppointment = async () => {
    const payload = {
      grund: title.trim(),
      startzeitpkt: toTimestampString(startDate, startTime),
      endzeitpkt: toTimestampString(endDate, endTime),
      status,
    };

    if (editingAppointmentId) {
      const { error } = await supabase
        .from("termine")
        .update(payload)
        .eq("id", editingAppointmentId);
      if (error) {
        toast.error(`Speichern fehlgeschlagen: ${error.message}`);
        return null;
      }
      return editingAppointmentId;
    }

    const { data, error } = await supabase
      .from("termine")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      toast.error(`Speichern fehlgeschlagen: ${error?.message ?? "Unbekannt"}`);
      return null;
    }

    return data.id as number;
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

  const hasOverlap = async () => {
    const newStart = toTimestampString(startDate, startTime);
    const newEnd = toTimestampString(endDate, endTime);
    if (!newStart || !newEnd) {
      return false;
    }

    let query = supabase
      .from("termine")
      .select("id, startzeitpkt, endzeitpkt")
      .lt("startzeitpkt", newEnd)
      .gt("endzeitpkt", newStart);

    if (editingAppointmentId) {
      query = query.neq("id", editingAppointmentId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Overlap check failed:", error.message);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  };

  useEffect(() => {
    const appointment = (location.state as { appointment?: Appointment } | null)
      ?.appointment;
    if (!appointment || prefilled) {
      return;
    }
    setTitle(appointment.title ?? "");
    setStartDate(appointment.startDate ?? "");
    setEndDate(appointment.endDate ?? "");
    setStartTime(appointment.startTime ?? "");
    setEndTime(appointment.endTime ?? "");
    setStatus(appointment.status ?? "Auswählen");
    setErrors({
      title: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      status: "",
    });
    setPrefilled(true);
  }, [location.state, prefilled]);

  useEffect(() => {
    if (!editingAppointmentId || prefilled) {
      return;
    }

    const loadAppointment = async () => {
      const { data, error } = await supabase
        .from("termine")
        .select("id, grund, startzeitpkt, endzeitpkt, status")
        .eq("id", editingAppointmentId)
        .maybeSingle();

      if (error || !data) {
        toast.error(
          `Termin konnte nicht geladen werden: ${error?.message ?? "Unbekannt"}`,
        );
        return;
      }

      const start = data.startzeitpkt
        ? { date: data.startzeitpkt.slice(0, 10), time: data.startzeitpkt.slice(11, 16) }
        : { date: "", time: "" };
      const end = data.endzeitpkt
        ? { date: data.endzeitpkt.slice(0, 10), time: data.endzeitpkt.slice(11, 16) }
        : { date: "", time: "" };

      setTitle(data.grund ?? "");
      setStartDate(start.date);
      setEndDate(end.date);
      setStartTime(start.time);
      setEndTime(end.time);
      setStatus(data.status ?? "Auswählen");
      setErrors({
        title: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        status: "",
      });
      setPrefilled(true);
    };

    loadAppointment();
  }, [editingAppointmentId, prefilled]);

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
                      (async () => {
                        if (!editingAppointment) {
                          if (isEndBeforeStart()) {
                            toast.error(
                              "Endzeit darf nicht vor der Startzeit liegen.",
                              { duration: 6000 }
                            );
                            return;
                          }
                          if (await hasOverlap()) {
                            toast.error(
                              "In diesem Zeitraum liegt schon ein Termin.",
                              { duration: 6000 }
                            );
                            return;
                          }
                        }
                        const appointmentId = await saveAppointment();
                        if (!appointmentId) {
                          return;
                        }
                        resetForm();
                        toast(
                          "Der Termin ist im Kalender gespeichert. Sie werden zum Kunden anlegen weitergeleitet."
                        );
                        setTimeout(() => {
                          navigate("/new-customer", {
                            state: { appointmentId },
                          });
                        }, 1200);
                      })();
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
                      (async () => {
                        if (!editingAppointment) {
                          if (isEndBeforeStart()) {
                            toast.error(
                              "Endzeit darf nicht vor der Startzeit liegen.",
                              { duration: 6000 }
                            );
                            return;
                          }
                          if (await hasOverlap()) {
                            toast.error(
                              "In diesem Zeitraum liegt schon ein Termin.",
                              { duration: 6000 }
                            );
                            return;
                          }
                        }
                        const appointmentId = await saveAppointment();
                        if (!appointmentId) {
                          return;
                        }
                        resetForm();
                        console.log("Der Termin ist im Kalender gespeichert.");
                        toast("Der Termin ist im Kalender gespeichert.");
                      })();
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
