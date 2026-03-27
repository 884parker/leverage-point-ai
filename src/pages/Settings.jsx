import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: () => base44.entities.RestaurantProfile.list(),
  });

  const profile = profiles[0];
  const [form, setForm] = useState({ restaurant_name: "", location: "", cuisine_type: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        restaurant_name: profile.restaurant_name || "",
        location: profile.location || "",
        cuisine_type: profile.cuisine_type || "",
      });
    }
  }, [profile]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RestaurantProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaving(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RestaurantProfile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    if (profile) {
      updateMutation.mutate({ id: profile.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Configure your restaurant profile" />

      <div className="bg-card rounded-xl border border-border p-6 max-w-xl">
        <h3 className="text-sm font-semibold text-card-foreground mb-5">Restaurant Profile</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurant Name</Label>
            <Input
              placeholder="e.g. The Blue Fig"
              value={form.restaurant_name}
              onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</Label>
            <Input
              placeholder="e.g. Downtown Miami"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cuisine Type</Label>
            <Input
              placeholder="e.g. Mediterranean"
              value={form.cuisine_type}
              onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}