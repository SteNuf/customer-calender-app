import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { type Appointment, type AppointmentRow } from "@/types/appointments";

interface AppointmentContextType {
  appointments: Appointment[];
  loading: boolean;
  loadAppointments: (showAll: boolean, selectedDate?: Date) => Promise<void>;
  saveAppointment: (
    payload: {
      reason: string;
      startpoint: string;
      endpoint: string;
      status: string;
      customer_id: number | null;
    },
    editingId?: number | null,
  ) => Promise<number | null>;
  deleteAppointment: (id: number) => Promise<boolean>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(
  undefined,
);

const splitDateTime = (value: string | null) => {
  if (!value) {
    return { date: "", time: "" };
  }
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  return { date, time };
};

const getCustomerName = (customer: AppointmentRow["customer"]) => {
  const customerData = Array.isArray(customer) ? customer[0] : customer;
  const firstName = customerData?.firstname?.trim() ?? "";
  const lastName = customerData?.name?.trim() ?? "";
  return `${firstName} ${lastName}`.trim();
};

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAppointments = useCallback(
    async (showAll: boolean, selectedDate?: Date) => {
      setLoading(true);
      try {
        let query = supabase
          .from("termine")
          .select(
            "id, created_at, reasen, startpoint, endpoint, status, customer:customer_id (firstname, name)",
          )
          .order("startpoint", {
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
            .gte("startpoint", startOfDay.toISOString())
            .lt("startpoint", endOfDay.toISOString());
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
            .gte("startpoint", startOfDay.toISOString())
            .lt("startpoint", endOfDay.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error("Failed to load appointments:", error.message);
          setAppointments([]);
          return;
        }

        const mapped = (data as AppointmentRow[]).map((row) => {
          const start = splitDateTime(row.startpoint);
          const end = splitDateTime(row.endpoint);
          return {
            id: row.id,
            title: row.reasen ?? "",
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
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const saveAppointment = useCallback(
    async (
      payload: {
        reason: string;
        startpoint: string;
        endpoint: string;
        status: string;
        customer_id: number | null;
      },
      editingId?: number | null,
    ) => {
      const dbPayload = {
        reasen: payload.reason,
        startpoint: payload.startpoint,
        endpoint: payload.endpoint,
        status: payload.status,
        customer_id: payload.customer_id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("termine")
          .update(dbPayload)
          .eq("id", editingId);
        if (error) {
          console.error("Failed to update appointment:", error.message);
          return null;
        }
        return editingId;
      }

      const { data, error } = await supabase
        .from("termine")
        .insert(dbPayload)
        .select("id")
        .single();

      if (error || !data) {
        console.error(
          "Failed to create appointment:",
          error?.message ?? "Unknown error",
        );
        return null;
      }

      return data.id as number;
    },
    [],
  );

  const deleteAppointment = useCallback(async (id: number) => {
    const { error } = await supabase.from("termine").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete appointment:", error.message);
      return false;
    }
    return true;
  }, []);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        loading,
        loadAppointments,
        saveAppointment,
        deleteAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error("useAppointments must be used within AppointmentProvider");
  }
  return context;
}
