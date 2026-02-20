import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: number;
  title: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  street: string;
  zip: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  createdAt: string;
};

export function NewCustomer() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(true);
  const [title, setTitle] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [errors, setErrors] = useState({
    lastName: "",
    firstName: "",
    street: "",
    zip: "",
    city: "",
    phone: "",
    email: "",
  });
  const handleSidebarEnter = useCallback(() => {
    setSidebarHoverOpen(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    setSidebarHoverOpen(false);
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const editingCustomer = (location.state as { customer?: Customer } | null)
    ?.customer;
  const appointmentId = (location.state as { appointmentId?: number } | null)
    ?.appointmentId;

  const validateRequired = () => {
    const nextErrors = {
      lastName: lastName.trim().length === 0 ? "Bitte Name eingeben." : "",
      firstName: firstName.trim().length === 0 ? "Bitte Vorname eingeben." : "",
      street: street.trim().length === 0 ? "Bitte Straße eingeben." : "",
      zip: zip.trim().length === 0 ? "Bitte Postleitzahl eingeben." : "",
      city: city.trim().length === 0 ? "Bitte Stadt eingeben." : "",
      phone: phone.trim().length === 0 ? "Bitte Telefon eingeben." : "",
      email: email.trim().length === 0 ? "Bitte Email eingeben." : "",
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === "");
  };

  const resetForm = () => {
    setTitle("");
    setLastName("");
    setFirstName("");
    setBirthDate("");
    setStreet("");
    setZip("");
    setCity("");
    setPhone("");
    setMobile("");
    setEmail("");
    setWebsite("");
    setErrors({
      lastName: "",
      firstName: "",
      street: "",
      zip: "",
      city: "",
      phone: "",
      email: "",
    });
  };

  useEffect(() => {
    const customer = (location.state as { customer?: Customer } | null)
      ?.customer;
    if (!customer || prefilled) {
      return;
    }
    setTitle(customer.title ?? "");
    setLastName(customer.lastName ?? "");
    setFirstName(customer.firstName ?? "");
    setBirthDate(customer.birthDate ?? "");
    setStreet(customer.street ?? "");
    setZip(customer.zip ?? "");
    setCity(customer.city ?? "");
    setPhone(customer.phone ?? "");
    setMobile(customer.mobile ?? "");
    setEmail(customer.email ?? "");
    setWebsite(customer.website ?? "");
    setErrors({
      lastName: "",
      firstName: "",
      street: "",
      zip: "",
      city: "",
      phone: "",
      email: "",
    });
    setPrefilled(true);
  }, [location.state, prefilled]);
  const saveCustomer = async () => {
    const payload = {
      titel: title.trim(),
      name: lastName.trim(),
      vorname: firstName.trim(),
      geburtstag: birthDate,
      strasse: street.trim(),
      plz: zip.trim() ? Number(zip.trim()) : null,
      city: city.trim(),
      festnetznr: phone.trim(),
      handynr: mobile.trim(),
      email: email.trim(),
      website: website.trim(),
    };

    if (editingCustomer?.id) {
      const { error } = await supabase
        .from("customer")
        .update(payload)
        .eq("id", editingCustomer.id);
      if (error) {
        toast.error(`Speichern fehlgeschlagen: ${error.message}`);
        return null;
      }
      return editingCustomer.id;
    }

    const { data, error } = await supabase
      .from("customer")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      toast.error(`Speichern fehlgeschlagen: ${error?.message ?? "Unbekannt"}`);
      return null;
    }

    return data.id as number;
  };

  const linkAppointmentToCustomer = async (customerId: number) => {
    if (!appointmentId) {
      return;
    }
    const { error } = await supabase
      .from("termine")
      .update({ customer_id: customerId })
      .eq("id", appointmentId);
    if (error) {
      toast.error(`Termin-Zuordnung fehlgeschlagen: ${error.message}`);
    }
  };

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
          <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
            <h1 className="text-3xl font-semibold text-center">Neuer Kunde</h1>
            <div className="mx-auto w-full max-w-[37rem] text-left mt-20">
              <div className="flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Titel:</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Name: *</span>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.lastName ? (
                <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Vorname: *</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.firstName ? (
                <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Geburtsdatum:</span>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => {
                    setBirthDate(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Straße: *</span>
                <input
                  type="text"
                  value={street}
                  onChange={(event) => {
                    setStreet(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.street ? (
                <p className="mt-2 text-sm text-red-600">{errors.street}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Postleitzahl:*</span>
                <input
                  type="text"
                  value={zip}
                  onChange={(event) => {
                    setZip(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.zip ? (
                <p className="mt-2 text-sm text-red-600">{errors.zip}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Stadt: *</span>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => {
                    setCity(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.city ? (
                <p className="mt-2 text-sm text-red-600">{errors.city}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Telefon: *</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.phone ? (
                <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Handy:</span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(event) => {
                    setMobile(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Email: *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {errors.email ? (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              ) : null}
              <div className="mt-6 flex items-center gap-4 text-xl text-muted-foreground">
                <span className="w-40">Website:</span>
                <input
                  type="url"
                  value={website}
                  onChange={(event) => {
                    setWebsite(event.target.value);
                  }}
                  className="ml-8 h-9 w-full max-w-sm rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                * Bitte ausfüllen
              </p>
              <div className="mt-24 flex w-full items-center justify-between gap-6">
                <button
                  type="button"
                  className="min-w-[10rem] rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => {
                    if (!validateRequired()) {
                      return;
                    }
                    (async () => {
                      const customerId = await saveCustomer();
                      if (!customerId) {
                        return;
                      }
                      await linkAppointmentToCustomer(customerId);
                      toast("Der Kunde wurde gespeichert.");
                      resetForm();
                    })();
                  }}
                >
                  Speichern
                </button>
                <button
                  type="button"
                  className="min-w-[12rem] rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => {
                    if (!validateRequired()) {
                      return;
                    }
                    (async () => {
                      const customerId = await saveCustomer();
                      if (!customerId) {
                        return;
                      }
                      await linkAppointmentToCustomer(customerId);
                      toast("Der Kunde wurde gespeichert.");
                      resetForm();
                      navigate("/new-date");
                    })();
                  }}
                >
                  Speichern + Neuer Termin
                </button>
                <button
                  type="button"
                  className="min-w-[8rem] rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => {
                    resetForm();
                    console.log("Abbrechen");
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
