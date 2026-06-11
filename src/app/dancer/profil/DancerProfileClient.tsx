"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Camera, Check, Target, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import PointsStepper from "@/components/PointsStepper";
import CompetitionResultsCard from "@/components/CompetitionResultsCard";
import GoalsList from "@/components/GoalsList";

const LEVELS = ["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"];

function getNeeded(levelIndex: number, isFreestyle: boolean): number {
  if (levelIndex === 0) return 7;
  if (levelIndex === 1) return 14;
  if (levelIndex === 2) return isFreestyle ? 21 : 28;
  return 0;
}

type Result = {
  id: string;
  competition_name: string;
  placement_freestyle: string | null;
  placement_slow: string | null;
  notes: string | null;
};

interface Props {
  userId: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  seasonGoals: string;
  pointsFreestyle: number;
  pointsSlow: number;
  levelFreestyle: number;
  levelSlow: number;
  competitionResults: Result[];
}

export default function DancerProfileClient(props: Props) {
  const [nameVal, setNameVal] = useState(props.name);
  const [phoneVal, setPhoneVal] = useState(props.phone);
  const [avatar, setAvatar] = useState<string | null>(props.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [goals, setGoals] = useState(props.seasonGoals);
  const [freestyle, setFreestyle] = useState(props.pointsFreestyle);
  const [slow, setSlow] = useState(props.pointsSlow);
  const [levelF, setLevelF] = useState(props.levelFreestyle);
  const [levelS, setLevelS] = useState(props.levelSlow);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${props.userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatar(data.publicUrl + "?t=" + Date.now());
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", props.userId);
    }
    setUploading(false);
  }

  function handleFreestyleChange(val: number) {
    setSuccess(false);
    if (val < 0) { setLevelF(l => Math.max(0, l - 1)); setFreestyle(0); return; }
    const needed = getNeeded(levelF, true);
    if (levelF < 3 && val >= needed) { setLevelF(l => Math.min(l + 1, 4)); setFreestyle(0); }
    else setFreestyle(val);
  }

  function handleSlowChange(val: number) {
    setSuccess(false);
    if (val < 0) { setLevelS(l => Math.max(0, l - 1)); setSlow(0); return; }
    const needed = getNeeded(levelS, false);
    if (levelS < 3 && val >= needed) { setLevelS(l => Math.min(l + 1, 4)); setSlow(0); }
    else setSlow(val);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    const supabase = createClient();
    const { error: err } = await supabase.from("profiles").update({
      name: nameVal,
      phone: phoneVal,
      season_goals: goals,
      points_freestyle: freestyle,
      points_slow: slow,
      level_freestyle: levelF,
      level_slow: levelS,
    }).eq("id", props.userId);
    if (err) setError("Noe gikk galt");
    else setSuccess(true);
    setSaving(false);
  }

  const neededF = getNeeded(levelF, true);
  const percentF = neededF > 0 ? Math.round((Math.min(freestyle, neededF) / neededF) * 100) : 100;
  const neededS = getNeeded(levelS, false);
  const percentS = neededS > 0 ? Math.round((Math.min(slow, neededS) / neededS) * 100) : 100;

  return (
    <form onSubmit={handleSave} className="space-y-4">

      {/* Profilbilde */}
      <Card>
        <CardContent className="pt-5 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {avatar
                ? <img src={avatar} alt="Profilbilde" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-purple-600">{nameVal.charAt(0)}</span>}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-1.5 hover:bg-purple-700">
              <Camera size={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          {uploading && <p className="text-xs text-gray-400">Laster opp...</p>}
        </CardContent>
      </Card>

      {/* Personlig info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User size={16} className="text-purple-500" /> Personlig informasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Navn</label>
            <Input value={nameVal} onChange={e => setNameVal(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" /> Telefon
            </label>
            <Input value={phoneVal} onChange={e => setPhoneVal(e.target.value)} placeholder="+47 000 00 000" type="tel" />
          </div>
        </CardContent>
      </Card>

      {/* Sesongmål */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target size={16} className="text-purple-500" /> Mine sesongmål
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400 mb-3">F.eks. triks du vil lære, mål for konkurranser, hva du vil jobbe med denne sesongen</p>
          <GoalsList value={goals} onChange={setGoals} />
        </CardContent>
      </Card>

      {/* Poeng og nivåer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-purple-500" /> Poeng og nivåer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "Freestyle", points: freestyle, level: levelF, percent: percentF, needed: neededF, onChange: handleFreestyleChange, disc: "freestyle" as const },
            { label: "Slow", points: slow, level: levelS, percent: percentS, needed: neededS, onChange: handleSlowChange, disc: "slow" as const },
          ].map(({ label, points, level, percent, needed, onChange, disc }, idx) => (
            <div key={label} className={idx > 0 ? "border-t pt-6" : ""}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{LEVELS[level]}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] px-0.5">
                    {LEVELS.map((name, i) => (
                      <span key={i} className={i <= level ? "text-purple-600 font-semibold" : "text-gray-400"}>{name}</span>
                    ))}
                  </div>
                  <div style={{ height: "12px", backgroundColor: "#e5e7eb", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", backgroundColor: "#7c3aed", borderRadius: "9999px",
                      width: `${Math.max(3, (level / 4) * 100 + (percent / 100) * (100 / 4))}%`,
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>
                <PointsStepper value={points} onChange={onChange} />
                {level >= 3 ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                    <Trophy size={14} className="text-yellow-500" />
                    Neste nivå avgjøres av plasseringer på stevner
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{Math.min(points, needed)} / {needed} poeng mot {LEVELS[level + 1]}</span>
                    <span>{percent}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Konkurranseresultater – har egne add/delete knapper */}
      <CompetitionResultsCard userId={props.userId} initialResults={props.competitionResults} />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl p-3">
          <Check size={16} /> Profilen er oppdatert!
        </div>
      )}
      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving || success}>
        {saving ? "Lagrer..." : "Lagre profil"}
      </Button>
    </form>
  );
}
