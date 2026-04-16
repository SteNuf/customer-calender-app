export type Appointment = {
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

export type AppointmentRow = {
  id: number;
  created_at: string;
  reasen: string | null;
  startpoint: string | null;
  endpoint: string | null;
  status: string | null;
  customer:
    | {
        firstname: string | null;
        name: string | null;
      }
    | {
        firstname: string | null;
        name: string | null;
      }[]
    | null;
};

export type CustomerOption = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
};

export const getCustomerName = (customer: AppointmentRow["customer"]) => {
  const customerData = Array.isArray(customer) ? customer[0] : customer;
  const firstName = customerData?.firstname?.trim() ?? "";
  const lastName = customerData?.name?.trim() ?? "";
  return `${firstName} ${lastName}`.trim();
};

export const splitDateTime = (value: string | null) => {
  if (!value) {
    return { date: "", time: "" };
  }
  const date = value.slice(0, 10);
  const time = value.slice(11, 16);
  return { date, time };
};
