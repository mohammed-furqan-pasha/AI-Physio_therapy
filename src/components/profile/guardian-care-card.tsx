"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GuardianInfo } from "@/types/gamification";
import { toast } from "sonner";
import { HeartHandshake, Pencil } from "lucide-react";

interface GuardianCareCardProps {
  info: GuardianInfo;
  onSaved: (info: GuardianInfo) => void;
}

/** Optional caregiver contact — relevant for minors and elderly patients doing physio unsupervised. */
export function GuardianCareCard({ info, onSaved }: GuardianCareCardProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(info);

  const recommendGuardian = info.age !== null && info.age !== undefined && (info.age < 16 || info.age >= 65);
  const hasGuardian = !!(info.guardianName || info.guardianPhone);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        age: form.age,
        guardian_name: form.guardianName,
        guardian_relation: form.guardianRelation,
        guardian_phone: form.guardianPhone,
        guardian_email: form.guardianEmail,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }

    toast.success("Saved");
    onSaved(form);
    setOpen(false);
  }

  return (
    <Card className={recommendGuardian && !hasGuardian ? "border-amber-400/40" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartHandshake className="h-4 w-4 text-teal-400" />
            Guardian / Caregiver
          </CardTitle>
          <CardDescription>Optional contact who can be reached if help is needed during a session.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guardian details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Your age</label>
                <Input type="number" min={1} max={120} value={form.age ?? ""} onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Guardian name</label>
                <Input value={form.guardianName ?? ""} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Relation</label>
                <Input placeholder="Parent, spouse, caregiver..." value={form.guardianRelation ?? ""} onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Phone</label>
                <Input type="tel" value={form.guardianPhone ?? ""} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input type="email" value={form.guardianEmail ?? ""} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      {hasGuardian && (
        <CardContent className="text-sm text-muted-foreground">
          {info.guardianName} ({info.guardianRelation}) · {info.guardianPhone}
        </CardContent>
      )}
      {recommendGuardian && !hasGuardian && (
        <CardContent className="text-sm text-amber-300">
          Based on age, adding a guardian contact is recommended.
        </CardContent>
      )}
    </Card>
  );
}
