import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type Customer = {
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

const STORAGE_KEY = "customers";

export function SearchCustomer() {
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSidebarEnter = useCallback(() => {
    setSidebarHoverOpen(true);
  }, []);
  const handleSidebarLeave = useCallback(() => {
    setSidebarHoverOpen(false);
  }, []);

  const query = (searchParams.get("query") ?? "").trim();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setCustomers([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Customer[];
      setCustomers(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCustomers([]);
    }
  }, []);

  const deleteCustomer = (createdAt: string) => {
    const ok = window.confirm(
      "Möchten Sie den Kunden wirklich löschen?"
    );
    if (!ok) {
      return;
    }
    setCustomers((prev) => {
      const next = prev.filter((item) => item.createdAt !== createdAt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const results = useMemo(() => {
    if (!query) {
      return [];
    }
    const normalized = query.toLowerCase();
    return customers
      .filter((customer) => {
        const first = customer.firstName?.toLowerCase() ?? "";
        const last = customer.lastName?.toLowerCase() ?? "";
        return first.includes(normalized) || last.includes(normalized);
      })
      .sort((a, b) => {
        const lastCompare = (a.lastName ?? "").localeCompare(
          b.lastName ?? "",
          "de",
          { sensitivity: "base" }
        );
        if (lastCompare !== 0) {
          return lastCompare;
        }
        return (a.firstName ?? "").localeCompare(b.firstName ?? "", "de", {
          sensitivity: "base",
        });
      });
  }, [customers, query]);

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
            <h1 className="text-3xl font-semibold text-center">
              Kundensuche
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Suchbegriff: {query || "-"}
            </p>
            <div className="mx-auto w-full max-w-[37rem] text-left mt-8">
              {query ? (
                results.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {results.map((customer) => (
                      <div
                        key={customer.createdAt}
                        className="flex items-center justify-between gap-4 rounded-md border border-input px-4 py-3"
                      >
                        <div>
                          <div className="text-base font-medium">
                            <button
                              type="button"
                              className="text-left text-base font-medium text-foreground hover:underline"
                              onClick={() => {
                                navigate("/new-customer", {
                                  state: { customer },
                                });
                              }}
                            >
                              {customer.firstName} {customer.lastName}
                            </button>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {customer.street}, {customer.zip} {customer.city}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {customer.phone}
                            {customer.mobile ? ` / ${customer.mobile}` : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="rounded p-1 transition-colors hover:bg-muted"
                          onClick={() => {
                            deleteCustomer(customer.createdAt);
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
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Keine Kunden gefunden.
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Bitte Suchbegriff eingeben.
                </p>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
