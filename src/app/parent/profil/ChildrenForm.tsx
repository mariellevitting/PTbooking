"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle, Trash2 } from "lucide-react";

interface Child {
  id: string;
  name: string;
}

export default function ChildrenForm({ parentId, children: initial }: { parentId: string; children: Child[] }) {
  const [children, setChildren] = useState<Child[]>(initial);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setSuccess(false);
    const supabase = createClient();
    const { data } = await supabase
      .from("children")
      .insert({ parent_id: parentId, name: newName.trim() })
      .select()
      .single();
    if (data) {
      setChildren(prev => [...prev, data]);
      setNewName("");
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("children").delete().eq("id", id);
    setChildren(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold text-base mb-4">Registrerte dansere</h2>
        {children.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen dansere lagt til ennå</p>
        ) : (
          <div className="space-y-2">
            {children.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <p className="font-medium text-sm">{c.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-semibold text-base mb-4">Legg til danser</h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Navn på danseren"
            required
          />
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 shrink-0" disabled={saving}>
            {saving ? "..." : "Legg til"}
          </Button>
        </form>
        {success && <p className="text-sm text-green-600 mt-2">Danser lagt til!</p>}
      </div>
    </div>
  );
}
