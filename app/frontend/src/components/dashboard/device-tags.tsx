import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Tag } from "lucide-react";

interface DeviceTagsProps {
  deviceId: Id<"medicalDevices">;
  tags?: string[];
}

export function DeviceTags({ deviceId, tags: initialTags = [] }: DeviceTagsProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const updateTags = useMutation(api.medicalDevices.updateDeviceTags);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    const tagToAdd = newTag.trim();
    if (tags.includes(tagToAdd)) {
      setNewTag("");
      return;
    }

    const updatedTags = [...tags, tagToAdd];
    setTags(updatedTags);
    setNewTag("");
    setIsAdding(false);

    try {
      await updateTags({ deviceId, tags: updatedTags });
    } catch (error) {
      setTags(tags); // Revert
      console.error("Failed to add tag", error);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    setTags(updatedTags);

    try {
      await updateTags({ deviceId, tags: updatedTags });
    } catch (error) {
      setTags(tags); // Revert
      console.error("Failed to remove tag", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Tag className="w-4 h-4" /> Tags
        </h3>
        {!isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Tag
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80">
            {tag}
            <button 
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && !isAdding && (
          <span className="text-xs text-muted-foreground italic">No tags assigned</span>
        )}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="Enter tag name..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleAddTag} className="h-8">Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8">Cancel</Button>
        </div>
      )}
    </div>
  );
}
