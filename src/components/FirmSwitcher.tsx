import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function FirmSwitcher() {
  const [open, setOpen] = useState(false);
  const { currentFirm, isLoading } = useAuth();

  if (isLoading || !currentFirm) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // For now, users typically belong to one firm
  // This can be extended if multi-firm membership is needed
  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{currentFirm.name}</span>
    </div>
  );
}
