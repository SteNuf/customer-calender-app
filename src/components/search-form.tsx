import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar";

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
          return;
        }
        navigate(`/search-customer?query=${encodeURIComponent(trimmed)}`);
      }}
    >
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative w-full max-w-[12rem]">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="search"
            placeholder="Kunden suchen..."
            className="pl-8 w-full"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
