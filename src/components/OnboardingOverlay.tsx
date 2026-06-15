"use client";

import { useState, useEffect } from "react";
import { Calendar, Trophy, Target, Star, ChevronRight, X } from "lucide-react";

const SLIDES = [
  { id: "welcome" },
  { id: "privattimer" },
  { id: "poeng" },
  { id: "konkurranser" },
  { id: "maal" },
];

const STORAGE_KEY = "ptbooking_onboarding_done";

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function done() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (animating) return;
    if (slide === SLIDES.length - 1) { done(); return; }
    setAnimating(true);
    setDirection("out");
    setTimeout(() => {
      setSlide(s => s + 1);
      setDirection("in");
      setTimeout(() => setAnimating(false), 400);
    }, 250);
  }

  function prev() {
    if (animating || slide === 0) return;
    setAnimating(true);
    setDirection("out");
    setTimeout(() => {
      setSlide(s => s - 1);
      setDirection("in");
      setTimeout(() => setAnimating(false), 400);
    }, 250);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Skip-knapp */}
      {slide > 0 && (
        <button
          onClick={done}
          className="absolute top-4 right-4 z-10 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Hopp over <X size={16} />
        </button>
      )}

      {/* Innhold */}
      <div
        className="flex-1 flex flex-col"
        style={{
          animation: direction === "in"
            ? "slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards"
            : "slideOut 0.25s ease-in forwards",
        }}
      >
        {slide === 0 && <WelcomeSlide onNext={next} />}
        {slide === 1 && <FeatureSlide
          icon={<Calendar size={40} className="text-purple-600" />}
          emoji="📅"
          title="Book privattime – enkelt som aldri før"
          description="Velg trener, tidspunkt og danseform på under ett minutt. Få bekreftelse med én gang – ingen venting, ingen ringing."
          color="bg-purple-50"
          highlight="Mye enklere enn noensinne"
        />}
        {slide === 2 && <FeatureSlide
          icon={<Trophy size={40} className="text-yellow-500" />}
          emoji="🏆"
          title="Poeng og nivå"
          description="Hold styr på fremgangen din i freestyle og slow. Appen viser automatisk hvor du er på veien mot neste nivå."
          color="bg-yellow-50"
          levels={["Rekrutt", "Litt øvet", "Mester", "Champ", "Elite"]}
        />}
        {slide === 3 && <FeatureSlide
          icon={<Star size={40} className="text-blue-500" />}
          emoji="⏳"
          title="Konkurranser"
          description="Se nedtelling til neste konkurranse og loggfør dine plasseringer fra NM, FDJ og mer."
          color="bg-blue-50"
          competition
        />}
        {slide === 4 && <FeatureSlide
          icon={<Target size={40} className="text-green-500" />}
          emoji="🎯"
          title="Sesongmål"
          description="Skriv inn hva du vil jobbe med denne sesongen – triks du vil lære, mål for konkurranser eller hva du vil oppnå."
          color="bg-green-50"
          last
          onDone={done}
        />}
      </div>

      {/* Navigasjonsknapp og prikker (ikke på velkomst) */}
      {slide > 0 && (
        <div className="px-6 pb-10 pt-4 flex flex-col items-center gap-4">
          <button
            onClick={next}
            className="w-full max-w-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            {slide === SLIDES.length - 1 ? "Kom i gang!" : "Neste"}
            {slide < SLIDES.length - 1 && <ChevronRight size={18} />}
          </button>
          {/* Prikker */}
          <div className="flex gap-2">
            {SLIDES.slice(1).map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === slide - 1 ? "w-6 h-2 bg-purple-600" : "w-2 h-2 bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-40px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function WelcomeSlide({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-purple-600 to-purple-800">
      {/* Logo/ikon */}
      <div
        className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mb-8 shadow-xl"
        style={{ animation: "pulse-scale 2.5s ease-in-out infinite" }}
      >
        <span className="text-5xl">💜</span>
      </div>

      {/* Tekst */}
      <div style={{ animation: "fadeUp 0.6s ease forwards", animationDelay: "0.2s", opacity: 0 }}>
        <p className="text-purple-200 text-sm font-semibold uppercase tracking-widest mb-3">Evolution Dance Studio</p>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Velkommen til<br />PT Booking
        </h1>
        <p className="text-purple-200 text-base leading-relaxed max-w-xs mx-auto">
          Din app for privattimer, fremgang og konkurranser
        </p>
      </div>

      <div
        className="mt-12"
        style={{ animation: "fadeUp 0.6s ease forwards", animationDelay: "0.6s", opacity: 0 }}
      >
        <button
          onClick={onNext}
          className="bg-white text-purple-700 font-bold px-10 py-4 rounded-2xl shadow-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
        >
          Kom i gang <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

interface FeatureSlideProps {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  color: string;
  highlight?: string;
  levels?: string[];
  competition?: boolean;
  last?: boolean;
  onDone?: () => void;
}

function FeatureSlide({ icon, emoji, title, description, color, highlight, levels, competition }: FeatureSlideProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      {/* Ikon-sirkel */}
      <div
        className={`w-24 h-24 rounded-3xl ${color} flex items-center justify-center mb-6 shadow-sm`}
        style={{ animation: "fadeUp 0.4s ease forwards", opacity: 0 }}
      >
        {icon}
      </div>

      <div style={{ animation: "fadeUp 0.4s ease forwards", animationDelay: "0.1s", opacity: 0 }}>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{title}</h2>
        <p className="text-gray-500 text-base leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>

      {/* Highlight-boks */}
      {highlight && (
        <div
          className="mt-6 bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3"
          style={{ animation: "fadeUp 0.4s ease forwards", animationDelay: "0.2s", opacity: 0 }}
        >
          <p className="text-purple-700 font-semibold text-sm">✨ {highlight}</p>
        </div>
      )}

      {/* Nivå-trapp */}
      {levels && (
        <div
          className="mt-6 flex gap-2 flex-wrap justify-center"
          style={{ animation: "fadeUp 0.4s ease forwards", animationDelay: "0.2s", opacity: 0 }}
        >
          {levels.map((level, i) => (
            <span
              key={level}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                i === 0 ? "bg-gray-100 text-gray-500 border-gray-200"
                : i === 1 ? "bg-blue-50 text-blue-600 border-blue-100"
                : i === 2 ? "bg-purple-50 text-purple-600 border-purple-100"
                : i === 3 ? "bg-yellow-50 text-yellow-600 border-yellow-100"
                : "bg-orange-50 text-orange-600 border-orange-100"
              }`}
            >
              {i === 4 ? "⭐ " : ""}{level}
            </span>
          ))}
          <p className="w-full text-xs text-gray-400 mt-1">Freestyle og slow – separat</p>
        </div>
      )}

      {/* Konkurranse-preview */}
      {competition && (
        <div
          className="mt-6 w-full max-w-xs space-y-2"
          style={{ animation: "fadeUp 0.4s ease forwards", animationDelay: "0.2s", opacity: 0 }}
        >
          <div className="bg-purple-600 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs text-purple-200 font-semibold">🏆 FDJ 6</p>
              <p className="text-sm font-bold text-white">22. august</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">67</p>
              <p className="text-xs text-purple-200">dager igjen</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border px-4 py-2.5 flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-700">🥇 NM 2025</p>
              <p className="text-xs text-gray-400">1. plass Freestyle</p>
            </div>
            <span className="text-xs bg-yellow-50 text-yellow-600 font-semibold px-2 py-1 rounded-full">Loggført</span>
          </div>
        </div>
      )}
    </div>
  );
}
