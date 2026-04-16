import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NewDate } from "@/components/newDate";
import { NewCustomer } from "@/components/newCustomer";
import { SearchCustomer } from "@/components/searchCustomer";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppointmentProvider } from "@/context/AppointmentContext";

export default function App() {
  return (
    <AppointmentProvider>
      <BrowserRouter basename="/customer-calender-app">
        <Routes>
          <Route path="/" element={<AppLayout />} />
          <Route path="/new-date" element={<NewDate />} />
          <Route path="/new-customer" element={<NewCustomer />} />
          <Route path="/search-customer" element={<SearchCustomer />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AppointmentProvider>
  );
}
