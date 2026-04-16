import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAppointments } from "@/context/AppointmentContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Appointment, type CustomerOption } from "@/types/appointments";

const toTimestampString = (date: string, time: string) => {
  if (!date || !time) {
    return "";
  }
  return `${date}T${time}:00`;
};

export function NewDate() {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
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
  const navigate = useNavigate();
  const location = useLocation();
  const { saveAppointment: saveAppointmentToContext, loadAppointments } = useAppointments();
  const editingAppointment = (
    location.state as { appointment?: Appointment } | null
  )?.appointment;
  const appointmentIdFromState = (
    location.state as { appointmentId?: number } | null
  )?.appointmentId;
  const editingAppointmentId =
    editingAppointment?.id ?? appointmentIdFromState ?? null;

  useEffect(() => {
    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from("customer")
        .select("id, name, vorname, festnetznr")
        .order("name", { ascending: true })
        .order("vorname", { ascending: true });

      if (error) {
        console.error("Failed to load customers:", error.message);
        setCustomers([]);
        return;
      }

      const mapped = (
        data as Array<{
          id: number;
          name: string | null;
          vorname: string | null;
          festnetznr: string | null;
        }>
      ).map((row) => ({
        id: row.id,
        firstName: row.vorname ?? "",
        lastName: row.name ?? "",
        phone: row.festnetznr ?? "",
      }));
      setCustomers(mapped);
    };

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalized = customerQuery.trim().toLowerCase();
    if (!normalized) {
      return customers;
    }
    return customers.filter((customer) => {
      const first = customer.firstName.toLowerCase();
      const last = customer.lastName.toLowerCase();
      return (
        first.includes(normalized) ||
        last.includes(normalized) ||
        `${first} ${last}`.includes(normalized)
      );
    });
  }, [customers, customerQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (selectedCustomerId === null) {
        setSelectedCustomer(null);
        return;
      }

      const match = customers.find(
        (customer) => customer.id === selectedCustomerId,
      );
      if (match) {
        setSelectedCustomer(match);
        setCustomerQuery(`${match.firstName} ${match.lastName}`.trim());
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [customers, selectedCustomerId]);

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
    setCustomerQuery("");
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
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
      startpoint: toTimestampString(startDate, startTime),
      endpoint: toTimestampString(endDate, endTime),
      status,
      customer_id: selectedCustomerId ?? selectedCustomer?.id ?? null,
    };

    const appointmentId = await saveAppointmentToContext(
      payload,
      editingAppointmentId,
    );

    if (!appointmentId) {
      toast.error(`Speichern fehlgeschlagen`);
      return null;
    }

    return appointmentId;
  };

  const toDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`);
  };

  const isEndBeforeStart = () => {
    const start = toDateTime(startDate, startTime);
    const end = toDateTime(endDate, endTime);
    return (
      Number.isFinite(start.getTime()) &&
      Number.isFinite(end.getTime()) &&
      end <= start
    );
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
    const timeoutId = window.setTimeout(() => {
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
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.state, prefilled]);

  useEffect(() => {
    if (!editingAppointmentId || prefilled) {
      return;
    }

    const loadAppointment = async () => {
      const { data, error } = await supabase
        .from("termine")
        .select("id, grund, startzeitpkt, endzeitpkt, status, customer_id")
        .eq("id", editingAppointmentId)
        .maybeSingle();

      if (error || !data) {
        toast.error(
          `Termin konnte nicht geladen werden: ${error?.message ?? "Unbekannt"}`,
        );
        return;
      }

      const start = data.startzeitpkt
        ? {
            date: data.startzeitpkt.slice(0, 10),
            time: data.startzeitpkt.slice(11, 16),
          }
        : { date: "", time: "" };
      const end = data.endzeitpkt
        ? {
            date: data.endzeitpkt.slice(0, 10),
            time: data.endzeitpkt.slice(11, 16),
          }
        : { date: "", time: "" };

      setTitle(data.grund ?? "");
      setStartDate(start.date);
      setEndDate(end.date);
      setStartTime(start.time);
      setEndTime(end.time);
      setStatus(data.status ?? "Auswählen");
      setSelectedCustomerId(data.customer_id ?? null);
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
        showActionButtons={false}
        showBackButton
        onBackClick={() => {
          navigate("/");
        }}
        onAllCustomersClick={() => {
          navigate("/search-customer");
        }}
        onToggleAllAppointments={() => {
          navigate("/?appointments=all");
        }}
        showAllAppointments={false}
      />
      <SidebarInset>
        <div className="sticky top-0 z-20 flex justify-start bg-background/95 px-4 py-3 backdrop-blur xl:hidden">
          <SidebarTrigger />
        </div>
        <main className="min-h-screen w-full">
          <div className="px-4 py-8 sm:px-6 sm:py-12 md:px-8">
            <div className="mx-auto w-full max-w-2xl text-left md:max-w-3xl">
              <h1 className="text-center text-2xl font-semibold sm:text-3xl md:text-4xl">
                Neuer Termin
              </h1>
              <div className="mt-8 sm:mt-12 md:mt-14">
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
                <div className="mt-6 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-xl">
                  <span className="text-sm sm:w-24 sm:text-xl">Kunde:</span>
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={customerQuery}
                      onChange={(event) => {
                        setCustomerQuery(event.target.value);
                        setSelectedCustomer(null);
                        setSelectedCustomerId(null);
                        setCustomerOpen(true);
                      }}
                      onFocus={() => {
                        setCustomerOpen(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setCustomerOpen(false);
                        }, 150);
                      }}
                      placeholder="Kunden suchen..."
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {customerOpen ? (
                      <div className="absolute z-10 mt-2 max-h-48 w-full overflow-auto rounded-md border border-input bg-popover shadow-md">
                        {filteredCustomers.length > 0 ? (
                          <div className="py-1">
                            {filteredCustomers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                className="flex w-full items-center px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setSelectedCustomer(customer);
                                  setSelectedCustomerId(customer.id);
                                  setCustomerQuery(
                                    `${customer.firstName} ${customer.lastName}`.trim(),
                                  );
                                  setCustomerOpen(false);
                                }}
                              >
                                <span className="flex-1">
                                  {customer.firstName} {customer.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {customer.phone || "--"}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            Keine Kunden gefunden.
                          </div>
                        )}
                      </div>
                    ) : null}
                    {selectedCustomer ? (
                      <input
                        type="hidden"
                        name="customerId"
                        value={selectedCustomer.id}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-start sm:gap-4 sm:text-xl">
                  <span className="text-sm sm:w-24 sm:pt-2 sm:text-xl">
                    Datum:
                  </span>
                  <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <input
                      type="date"
                      aria-label="Startdatum"
                      value={startDate}
                      onChange={(event) => {
                        setStartDate(event.target.value);
                      }}
                      className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm sm:text-base">bis</span>
                    <input
                      type="date"
                      aria-label="Enddatum"
                      value={endDate}
                      onChange={(event) => {
                        setEndDate(event.target.value);
                      }}
                      className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                {errors.startDate || errors.endDate ? (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.startDate || errors.endDate}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-start sm:gap-4 sm:text-xl">
                  <span className="text-sm sm:w-24 sm:pt-2 sm:text-xl">
                    Uhrzeit:
                  </span>
                  <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                    <input
                      type="time"
                      aria-label="Startzeit"
                      value={startTime}
                      onChange={(event) => {
                        setStartTime(event.target.value);
                      }}
                      className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span className="text-sm sm:text-base">bis</span>
                    <input
                      type="time"
                      aria-label="Endzeit"
                      value={endTime}
                      onChange={(event) => {
                        setEndTime(event.target.value);
                      }}
                      className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                {errors.startTime || errors.endTime ? (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.startTime || errors.endTime}
                  </p>
                ) : null}
                <div className="mt-5 flex flex-col gap-2 text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:text-xl">
                  <span className="text-sm sm:w-24 sm:text-xl">Status:</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:-ml-2.25 sm:w-auto"
                      >
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
                <div className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap md:gap-4">
                  <Button
                    className="w-full sm:w-auto md:min-w-52"
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
                              { duration: 6000 },
                            );
                            return;
                          }
                          if (await hasOverlap()) {
                            toast.error(
                              "In diesem Zeitraum liegt schon ein Termin.",
                              { duration: 6000 },
                            );
                            return;
                          }
                        }
                        const appointmentId = await saveAppointment();
                        if (!appointmentId) {
                          return;
                        }
                        resetForm();
                        await loadAppointments(false);
                        toast(
                          "Der Termin ist im Kalender gespeichert. Sie werden zum Kunden anlegen weitergeleitet.",
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
                    className="w-full sm:w-auto md:min-w-40"
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
                              { duration: 6000 },
                            );
                            return;
                          }
                          if (await hasOverlap()) {
                            toast.error(
                              "In diesem Zeitraum liegt schon ein Termin.",
                              { duration: 6000 },
                            );
                            return;
                          }
                        }
                        const appointmentId = await saveAppointment();
                        if (!appointmentId) {
                          return;
                        }
                        resetForm();
                        await loadAppointments(false);
                        toast("Der Termin ist im Kalender gespeichert.");
                      })();
                    }}
                  >
                    Speichern
                  </Button>
                  <Button
                    className="w-full sm:w-auto md:min-w-40"
                    variant="outline"
                    onClick={() => {
                      if (editingAppointmentId) {
                        toast("Der Vorgang ist abgebrochen.");
                        setTimeout(() => {
                          navigate("/");
                        }, 1200);
                        return;
                      }
                      resetForm();
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
