import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ShieldAlert, 
  Wifi, 
  Power, 
  Edit, 
  User,
  Clock
} from "lucide-react";

interface DeviceHistoryProps {
  deviceId: Id<"medicalDevices">;
}

export function DeviceHistory({ deviceId }: DeviceHistoryProps) {
  const history = useQuery(api.audit.getDeviceHistory, { deviceId });

  if (history === undefined) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-4 text-center border rounded-md bg-muted/20">
        <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">No history available</p>
        <p className="text-xs text-muted-foreground">Changes to this device will appear here.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "risk_change": return <Activity className="w-4 h-4 text-orange-500" />;
      case "cve_match": return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "network_change": return <Wifi className="w-4 h-4 text-blue-500" />;
      case "status_change": return <Power className="w-4 h-4 text-green-500" />;
      case "owner_change": return <User className="w-4 h-4 text-purple-500" />;
      default: return <Edit className="w-4 h-4 text-gray-500" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "risk_change": return "outline";
      case "cve_match": return "destructive";
      case "network_change": return "secondary";
      default: return "secondary";
    }
  };

  const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Clock className="w-4 h-4" /> Change History
      </h3>
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4 relative ml-2 border-l border-border pl-4">
          {history.map((item) => (
            <div key={item._id} className="relative pb-1">
              {/* Dot on timeline */}
              <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-border ring-4 ring-background" />
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(item.type)}
                    <Badge variant={getBadgeVariant(item.type) as any} className="text-[10px] px-1 py-0 h-5">
                      {formatType(item.type)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <p className="text-sm mt-1">{item.details}</p>
                
                {item.userId && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>Changed by {item.userId}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
