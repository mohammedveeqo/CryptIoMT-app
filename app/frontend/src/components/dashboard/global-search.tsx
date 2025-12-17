"use client";

import * as React from "react";
import { Command } from "cmdk";
import { Search, Loader2, Monitor, AlertTriangle, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOrganization } from "@/contexts/organization-context";
import { useSearch } from "@/contexts/search-context";

export function GlobalSearch() {
  const { setOpen } = useSearch();

  return (
      <button
        onClick={() => setOpen(true)}
        className="relative h-9 w-full justify-start rounded-md border border-input bg-background px-4 py-2 text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 flex items-center gap-2 hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
  );
}

export function GlobalSearchDialog() {
  const { open, setOpen } = useSearch();
  const [query, setQuery] = React.useState("");
  const router = useRouter();
  const { currentOrganization } = useOrganization();

  // Debounce query
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery(api.search.searchGlobal, 
    debouncedQuery && currentOrganization ? { query: debouncedQuery, organizationId: currentOrganization._id } : "skip"
  );

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, [setOpen]);

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg sm:max-w-2xl">
          <DialogTitle className="sr-only">Global Search</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command or search..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              <Command.Empty className="py-6 text-center text-sm">
                {query ? "No results found." : "Start typing to search..."}
              </Command.Empty>
              
              {results === undefined && query && (
                  <div className="py-6 text-center text-sm flex justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
              )}

              {results?.devices && results.devices.length > 0 && (
                <Command.Group heading="Devices" className="p-2 text-xs font-medium text-muted-foreground">
                  {results.devices.map((device: any) => (
                    <Command.Item
                      key={device._id}
                      value={device.title + " " + device.subtitle}
                      onSelect={() => runCommand(() => router.push(device.url))}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <Monitor className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{device.title}</span>
                        <span className="text-xs text-muted-foreground">{device.subtitle}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {results?.cves && results.cves.length > 0 && (
                <Command.Group heading="Vulnerabilities" className="p-2 text-xs font-medium text-muted-foreground">
                  {results.cves.map((cve: any) => (
                    <Command.Item
                      key={cve._id}
                      value={cve.title + " " + cve.subtitle}
                      onSelect={() => runCommand(() => router.push(cve.url))}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                      <div className="flex flex-col">
                        <span>{cve.title}</span>
                        <span className="text-xs text-muted-foreground">{cve.subtitle}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
              
              <Command.Group heading="Pages" className="p-2 text-xs font-medium text-muted-foreground">
                    <Command.Item value="Dashboard" onSelect={() => runCommand(() => router.push("/dashboard"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground">
                        <Monitor className="mr-2 h-4 w-4" /> Dashboard
                    </Command.Item>
                    <Command.Item value="Reports" onSelect={() => runCommand(() => router.push("/dashboard/reports"))} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground">
                        <FileText className="mr-2 h-4 w-4" /> Reports
                    </Command.Item>
              </Command.Group>

            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
  );
}
