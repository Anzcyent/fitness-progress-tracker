import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  History,
  Pencil,
  Plus,
  Repeat,
  Sparkles,
  Timer,
  Trash2,
  TriangleAlert,
  Weight,
  X,
} from "lucide-react";

const STORAGE_KEY = "workout-data-v1";
const TUTORIAL_KEY = "fitness-tutorial-v1";
const DEFAULT_TUTORIAL = { never: false, done: false };
const DEFAULT_REST = 120;
const MAX_SETS = 6;
const ROW_GRID =
  "grid grid-cols-[1.5rem_1fr_1fr_1fr] items-center gap-1";

const DAY_FULL = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const ACCENTS = [
  { chip: "bg-lime-400/10 text-lime-300 ring-lime-400/25", text: "text-lime-300", focus: "focus:border-lime-400 focus:ring-lime-400/40" },
  { chip: "bg-sky-400/10 text-sky-300 ring-sky-400/25", text: "text-sky-300", focus: "focus:border-sky-400 focus:ring-sky-400/40" },
  { chip: "bg-amber-400/10 text-amber-300 ring-amber-400/25", text: "text-amber-300", focus: "focus:border-amber-400 focus:ring-amber-400/40" },
  { chip: "bg-rose-400/10 text-rose-300 ring-rose-400/25", text: "text-rose-300", focus: "focus:border-rose-400 focus:ring-rose-400/40" },
  { chip: "bg-violet-400/10 text-violet-300 ring-violet-400/25", text: "text-violet-300", focus: "focus:border-violet-400 focus:ring-violet-400/40" },
  { chip: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/25", text: "text-cyan-300", focus: "focus:border-cyan-400 focus:ring-cyan-400/40" },
];

const normalizeName = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/i\u0307/g, "i");

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

const EMOJI_RULES = [
  {
    emoji: "🏃",
    terms: [
      "kardiyo", "cardio", "kosu", "running", "bisiklet", "cycl", "eliptik",
      "elliptical", "ip atlama", "jump rope", "jumping jack", "burpee",
      "yuruyus", "walk", "stepper", "treadmill", "rowing machine", "hiit",
      "zumba", "aerobik", "aerobics", "yuzme", "swim",
    ],
  },
  {
    emoji: "🔥",
    terms: [
      "karin", "abs", "core", "plank", "crunch", "mekik", "sit-up", "situp",
      "sit up", "leg raise", "russian twist", "woodchop", "hollow", "dead bug",
      "flutter kick", "mountain climber", "bicycle crunch", "scissor", "bel ",
      "cable crunch", "v-up", "v up", "toe touch",
    ],
  },
  {
    emoji: "🦵",
    terms: [
      "bacak", "leg ", "leg-", "legs", "squat", "lunge", "calf", "baldir",
      "hamstring", "quad", "glute", "kalca", "hip thrust", "hip ",
      "adductor", "abductor", "adduktor", "abduktor", "step up", "step-up",
      "leg curl", "leg extension", "leg press", "hack squat", "sumo",
      "split squat", "good morning", "sissy", "donkey", "rdl",
      "romanian deadlift", "stiff leg", "pistol squat", "wall sit", "bridge",
    ],
  },
  {
    emoji: "🤸",
    terms: [
      "omuz", "shoulder", "military press", "overhead press", "ohp",
      "arnold press", "lateral raise", "lateral delt", "front raise",
      "rear delt", "reverse fly", "shrug", "trapez", "trap ", "upright row",
      "deltoid", "delt ", "landmine press", "handstand",
    ],
  },
  {
    emoji: "🏋️",
    terms: [
      "gogus", "chest", "bench press", "bench", "fly", "flye", "pec",
      "pec deck", "push-up", "push up", "pushup", "sinav", "crossover",
      "dip", "guillotine", "chest press", "gogus pres", "dumbbell press",
      "svend",
    ],
  },
  {
    emoji: "🧗",
    terms: [
      "sirt", "lat ", "lats", "row", "kurek", "cekis",
      "pulldown", "pull down", "pull-up", "pullup", "pull up", "chin-up",
      "chin up", "chinup", "barfiks", "deadlift", "hyperextension", "ters mekik",
      "face pull", "t-bar", "t bar", "seated row", "cable row",
    ],
  },
  {
    emoji: "💪",
    terms: [
      "biceps", "biseps", "triceps", "triseps", "kol", "arm ", "curl",
      "hammer", "scott", "preacher", "concentration", "pushdown",
      "push down", "skull crusher", "french press", "fransiz", "wrist",
      "forearm", "bilek", "on kol", "arka kol", "kickback",
      "overhead extension", "triceps extension",
    ],
  },
  {
    emoji: "🧘",
    terms: [
      "esneklik", "mobilite", "mobility", "stretch", "germe", "yoga", "pilates",
      "esneme", "foam roller", "cat cow", "downward dog",
    ],
  },
];

const getEmoji = (name) => {
  const n = normalizeName(name);
  const rule = EMOJI_RULES.find(({ terms }) => hasAny(n, terms));
  return rule ? rule.emoji : "🏋️";
};

const loadTutorial = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(TUTORIAL_KEY));
    return raw && typeof raw === "object"
      ? { ...DEFAULT_TUTORIAL, ...raw }
      : { ...DEFAULT_TUTORIAL };
  } catch {
    return { ...DEFAULT_TUTORIAL };
  }
};

const saveTutorial = (state) =>
  localStorage.setItem(TUTORIAL_KEY, JSON.stringify(state));

const TOUR_STEPS = [
  {
    id: "day",
    selector: "[data-tour='day-nav']",
    title: "Gün & Hafta Seçimi",
    body: "Takvimden çalışacağın günü seç. 'Geçen Hafta' ve 'Bu Hafta' sekmeleriyle başka haftaların kayıtlarını da görüntüleyebilirsin. Kayıtlı günler turuncu noktayla işaretlenir.",
  },
  {
    id: "add",
    selector: "[data-tour='add-exercise']",
    title: "Egzersiz Ekle",
    body: "'Yeni Egzersiz Ekle' butonuyla kart açılır. Adını yazdığında (örn. Hammer Curl) ikonu kas grubuna göre otomatik belirlenir.",
  },
  {
    id: "card",
    selector: "[data-tour='exercise-card']",
    title: "Setlerini Doldur",
    body: "Her set için ağırlık (kg), tekrar (tkr) ve dinlenme süresini (sn) gir. Yetmezse '+ Set Ekle' ile yeni satır ekleyebilirsin.",
  },
  {
    id: "history",
    selector: "[data-tour='exercise-card'] [data-tour='history']",
    title: "Geçmiş Hafta Önizlemesi",
    body: "Adı geçen haftaki kaydınla aynıysa, geçen haftanın setleri sana soluk bir önizleme olarak sunulur. Böylece geçmiş performansını görüp kendini aşabilirsin.",
  },
  {
    id: "save",
    selector: "[data-tour='exercise-card'] [data-tour='save']",
    title: "Kaydet & Tamamla",
    body: "Tüm setleri doldurduktan sonra 'Kaydet'e bas; kart daralır. İstersen kartı açıp tekrar düzenleyebilirsin.",
  },
];

let nextId = 1;

const parseRest = (v) => {
  if (v == null || v === "") return null;
  const s = String(v);
  if (s.includes(":")) {
    const [m, sec] = s.split(":").map(Number);
    if (!Number.isNaN(m) && !Number.isNaN(sec)) return m * 60 + sec;
    return null;
  }
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
};

const normalizeExercise = (ex) => {
  if (!ex || typeof ex !== "object" || ex.id === undefined) return null;
  const already = Array.isArray(ex.sets) && ex.sets.some((s) => s && typeof s === "object");
  if (already) {
    return {
      ...ex,
      weight: undefined,
      rests: undefined,
      sets: ex.sets.map((s) => ({
        weight: "",
        reps: 0,
        completed: false,
        rest: DEFAULT_REST,
        ...s,
      })),
    };
  }
  const oldSets = Array.isArray(ex.sets) ? ex.sets : [];
  const oldRests = Array.isArray(ex.rests) ? ex.rests : [];
  return {
    id: ex.id,
    name: ex.name ?? "",
    rest: parseRest(oldRests[0]) ?? DEFAULT_REST,
    sets: oldSets.map((reps, i) => ({
      weight: typeof ex.weight === "string" ? ex.weight : ex.weight != null ? String(ex.weight) : "",
      reps: typeof reps === "number" ? reps : 0,
      completed: false,
      rest: parseRest(oldRests[i]) ?? DEFAULT_REST,
    })),
  };
};

const normalizeData = (raw) => {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Array.isArray(v)) out[k] = v.map(normalizeExercise).filter(Boolean);
    else out[k] = v;
  }
  return out;
};

const createSet = () => ({ weight: "", reps: 0, completed: false, rest: "" });

const createExercise = () => ({
  id: nextId++,
  name: "",
  sets: [createSet()],
});

const toISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

const getMonday = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  return addDays(d, diff);
};

const getWeekDates = (weekOffset) => {
  const monday = addDays(getMonday(new Date()), -weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(monday, i)));
};

const getTodayIndex = () => (new Date().getDay() + 6) % 7;

const loadData = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return raw && typeof raw === "object" ? normalizeData(raw) : {};
  } catch {
    return {};
  }
};

const fmtDayNum = (iso) => new Date(iso + "T00:00:00").getDate();

function App() {
  const [data, setData] = useState(loadData);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [toast, setToast] = useState(null);
  const [tutorialPref, setTutorialPref] = useState(loadTutorial);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [demoId, setDemoId] = useState(null);
  const [demoKey, setDemoKey] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const todayIndex = getTodayIndex();
  const weekDates = getWeekDates(weekOffset);
  const currentKey = weekDates[selectedDay];
  const exercises = data[currentKey] || [];
  const isToday = weekOffset === 0 && selectedDay === todayIndex;

  const selectedDate = new Date(currentKey + "T00:00:00");
  const dayLabel = DAY_FULL[selectedDay];
  const fullDate = selectedDate.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const prevKey = toISO(addDays(selectedDate, -7));
  const prevExercises = data[prevKey] || [];
  const hasPrevWeek = prevExercises.length > 0;
  const prevLabel = new Date(prevKey + "T00:00:00").toLocaleDateString(
    "tr-TR",
    { day: "numeric", month: "short" }
  );

  const findPrevMatch = (name) => {
    const nn = normalizeName(name).trim();
    if (!nn) return undefined;
    const exact = prevExercises.find(
      (p) => normalizeName(p.name).trim() === nn
    );
    if (exact) return exact;
    if (nn.length >= 3) {
      const candidates = prevExercises.filter((p) =>
        normalizeName(p.name).trim().startsWith(nn)
      );
      return candidates.length === 1 ? candidates[0] : undefined;
    }
    return undefined;
  };

  const weekRange = `${new Date(
    weekDates[0] + "T00:00:00"
  ).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  })} – ${new Date(weekDates[6] + "T00:00:00").toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  })}`;

  const setExercises = (listOrFn) =>
    setData((prev) => ({
      ...prev,
      [currentKey]:
        typeof listOrFn === "function"
          ? listOrFn(prev[currentKey] || [])
          : listOrFn,
    }));

  const addExercise = () => setExercises((prev) => [...prev, createExercise()]);

  const notifySave = (name) =>
    setToast({
      id: Date.now(),
      message: `${name} isimli hareket başarıyla kaydedildi.`,
      tone: "success",
    });

  const removeExercise = (id) => {
    const target = (data[currentKey] || []).find((ex) => ex.id === id);
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    setToast({
      id: Date.now(),
      message: `${target?.name ?? "Hareket"} isimli hareket silindi.`,
      tone: "danger",
    });
  };

  const patch = (id, updater) =>
    setExercises((prev) => prev.map((ex) => (ex.id === id ? updater(ex) : ex)));

  const updateName = (id, value) => patch(id, (ex) => ({ ...ex, name: value }));

  const updateSetWeight = (id, setIndex, value) => {
    const cleaned = value.replace(/[^0-9.,]/g, "").slice(0, 5);
    patch(id, (ex) => ({
      ...ex,
      sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, weight: cleaned } : s)),
    }));
  };

  const updateSetRep = (id, setIndex, value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 3);
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    patch(id, (ex) => ({
      ...ex,
      sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, reps: num } : s)),
    }));
  };

  const updateSetRest = (id, setIndex, value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    patch(id, (ex) => ({
      ...ex,
      sets: ex.sets.map((s, i) => (i === setIndex ? { ...s, rest: cleaned } : s)),
    }));
  };

  const addSet = (id) =>
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== id) return ex;
        if (ex.sets.length >= MAX_SETS) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { ...createSet(), weight: lastSet.weight, reps: lastSet.reps, rest: lastSet.rest },
          ],
        };
      })
    );

  const removeSet = (id) =>
    patch(id, (ex) =>
      ex.sets.length > 1
        ? { ...ex, sets: ex.sets.slice(0, -1) }
        : ex
    );

  const copyFromLastWeek = () => {
    setExercises(prevExercises.map((ex) => ({ ...ex, id: nextId++ })));
  };

  const updateTutorial = (patch) => {
    const next = { ...tutorialPref, ...patch };
    saveTutorial(next);
    setTutorialPref(next);
  };

  const seedDemo = () => {
    if ((data[currentKey] || []).length > 0) return;
    const id = nextId++;
    const demo = {
      id,
      name: "Hammer Curl",
      sets: [
        { weight: "20", reps: 12, completed: false, rest: "90" },
        { weight: "20", reps: 10, completed: false, rest: "120" },
        { weight: "20", reps: 8, completed: false, rest: "120" },
      ],
    };
    setData((prev) => ({
      ...prev,
      [currentKey]: [...(prev[currentKey] || []), demo],
    }));
    setDemoId(id);
    setDemoKey(currentKey);
  };

  const endTour = () => {
    if (demoId != null && demoKey != null) {
      setData((prev) => ({
        ...prev,
        [demoKey]: (prev[demoKey] || []).filter((ex) => ex.id !== demoId),
      }));
    }
    setDemoId(null);
    setDemoKey(null);
    setTutorialActive(false);
  };

  const handleConfirmTutorial = (never) => {
    updateTutorial({ done: true, ...(never ? { never: true } : {}) });
    seedDemo();
    setTutorialActive(true);
  };

  const handleSkipTutorial = (never) => {
    if (never) updateTutorial({ never: true });
  };

  const showTutorialPrompt =
    !tutorialActive && !tutorialPref.done && !tutorialPref.never;

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 antialiased">
      <style>{`
        @keyframes promptPop {
          from { opacity: 0; transform: translateY(12px) scale(.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tourPop {
          from { opacity: 0; transform: translateY(8px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {showTutorialPrompt && (
        <TutorialPrompt
          onConfirm={handleConfirmTutorial}
          onSkip={handleSkipTutorial}
        />
      )}
      {tutorialActive && (
        <TourOverlay steps={TOUR_STEPS} onEnd={endTour} />
      )}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onDone={() => setToast(null)}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute top-32 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <main className="relative mx-auto w-full max-w-lg px-4 pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-10 -mx-4 border-b border-zinc-800/60 bg-zinc-950/85 px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-sm shadow-lg shadow-lime-500/20">
              💪
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
              Antrenman Takibi
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <h1 className="flex items-center gap-2 bg-gradient-to-r from-lime-200 via-emerald-300 to-emerald-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              {dayLabel}
              {isToday && (
                <span className="rounded-full bg-lime-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-300 ring-1 ring-lime-400/40">
                  Bugün
                </span>
              )}
            </h1>
            <div className="pb-1 text-right">
              <p className="text-xs font-medium text-zinc-300">{fullDate}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {exercises.length} egzersiz • {totalSets} set
              </p>
            </div>
          </div>
        </header>

        <div
          data-tour="day-nav"
          className="mt-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-3 shadow-xl shadow-black/20 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 rounded-xl bg-zinc-800/70 p-1">
              <button
                type="button"
                onClick={() => setWeekOffset(1)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  weekOffset === 1
                    ? "bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/25"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Geçen Hafta
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
                  weekOffset === 0
                    ? "bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/25"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Bu Hafta
              </button>
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-500">
              {weekRange}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {weekDates.map((iso, i) => {
              const active = i === selectedDay;
              const todayTab = weekOffset === 0 && i === todayIndex;
              const has = (data[iso] || []).length > 0;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDay(i)}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-lime-400/15 text-lime-300 ring-1 ring-lime-400/40"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-[11px] font-bold">{DAY_SHORT[i]}</span>
                  <span className="text-[10px] font-semibold tabular-nums text-zinc-500">
                    {fmtDayNum(iso)}
                  </span>
                  <span
                    className={`mt-1 h-1 w-1 rounded-full ${
                      has
                        ? "bg-amber-400"
                        : todayTab
                          ? "bg-lime-400/70"
                          : "bg-zinc-700"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={addExercise}
          data-tour="add-exercise"
          className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-700 text-base font-semibold text-zinc-300 transition hover:border-lime-400 hover:bg-lime-400/5 hover:text-lime-300 active:scale-[0.99]"
        >
          <span className="text-2xl leading-none">+</span> Yeni Egzersiz Ekle
        </button>

        {exercises.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
            <p className="text-sm text-zinc-400">Bu güne ait kayıt yok.</p>
            {hasPrevWeek ? (
              <button
                type="button"
                onClick={copyFromLastWeek}
                className="mt-3 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-2.5 text-sm font-semibold text-lime-300 transition hover:bg-lime-400/20 active:scale-[0.98]"
              >
                Geçen hafta {DAY_FULL[selectedDay]} kaydını kopyala
              </button>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">
                "Yeni Egzersiz Ekle" ile başla.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {exercises.map((exercise, index) => {
              const prevExercise = findPrevMatch(exercise.name);
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  accent={ACCENTS[index % ACCENTS.length]}
                  prevExercise={prevExercise}
                  prevLabel={prevLabel}
                  forceExpand={tutorialActive && index === 0}
                  onUpdateName={updateName}
                  onUpdateSetWeight={updateSetWeight}
                  onUpdateSetRep={updateSetRep}
                  onUpdateSetRest={updateSetRest}
                  onAddSet={addSet}
                  onRemoveSet={removeSet}
                  onRemove={removeExercise}
                  onSave={notifySave}
                />
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-lime-400/70" /> Set
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />{" "}
            Dinlenme (sn)
          </span>
        </div>
      </main>
    </div>
  );
}

function ExerciseCard({
  exercise,
  prevExercise,
  prevLabel,
  forceExpand = false,
  onUpdateName,
  onUpdateSetWeight,
  onUpdateSetRep,
  onUpdateSetRest,
  onAddSet,
  onRemoveSet,
  onRemove,
  onSave,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (forceExpand) {
      // oxlint-disable-next-line react/set-state-in-effect
      setCollapsed(false);
    }
  }, [forceExpand]);

  const nameMissing = exercise.name.trim() === "";
  const emptyIndexes = exercise.sets
    .map((s, i) =>
      s.weight.trim() === "" ||
      !(Number(s.reps) > 0) ||
      String(s.rest ?? "").trim() === ""
        ? i
        : -1
    )
    .filter((i) => i !== -1);
  const canSave = !nameMissing && emptyIndexes.length === 0;
  const atMaxSets = exercise.sets.length >= MAX_SETS;
  const emoji = getEmoji(exercise.name);
  const showNameInput = !collapsed && (editingName || nameMissing);

  const inputBase =
    "h-10 w-full rounded-xl border bg-zinc-800/50 px-2 text-center text-sm font-semibold tabular-nums text-zinc-100 placeholder:font-medium placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors";
  const unitCls =
    "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-wide text-zinc-500";
  const headerCls = (field, idleColor) =>
    `flex items-center justify-center gap-1 transition-colors ${
      focusedField === field ? "text-lime-400" : idleColor
    }`;

  const toggleCollapsed = () => {
    if (!collapsed) setEditingName(false);
    setCollapsed(!collapsed);
  };

  const commitName = () => setEditingName(false);

  const handleSave = () => {
    setAttempted(true);
    if (canSave) {
      setCollapsed(true);
      setEditingName(false);
      onSave(exercise.name);
    }
  };

  return (
    <section
      data-tour="exercise-card"
      className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950/70 p-3 shadow-xl shadow-black/25 transition-colors hover:border-zinc-700/70"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500/10 p-2 text-lg text-lime-400 ring-1 ring-lime-500/20">
          {emoji}
        </span>

        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="min-w-0 flex-1 rounded-xl py-1 pl-1 text-left transition hover:bg-zinc-800/40"
          >
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {exercise.name}
            </h3>
            <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
              <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-amber-400/80 align-middle" />
              {exercise.sets.length} set
            </p>
          </button>
        ) : showNameInput ? (
          <input
            type="text"
            placeholder="Egzersiz adı (örn. Göğüs Fly)"
            enterKeyHint="done"
            autoFocus={editingName}
            value={exercise.name}
            onChange={(e) => onUpdateName(exercise.id, e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
            }}
            aria-invalid={attempted && nameMissing}
            className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-700/60 bg-zinc-800/50 px-3 text-sm font-semibold text-zinc-100 placeholder:font-medium placeholder:text-zinc-500 focus:border-lime-400/50 focus:outline-none focus:ring-2 focus:ring-lime-500/30"
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {exercise.name}
            </h3>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              aria-label="Egzersiz adını düzenle"
              className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Pencil size={13} strokeWidth={2} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Kartı aç" : "Kartı daralt"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
        >
          {collapsed ? (
            <ChevronDown size={17} strokeWidth={2} />
          ) : (
            <ChevronUp size={17} strokeWidth={2} />
          )}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`transition-opacity duration-300 ease-in-out ${
              collapsed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            {attempted && nameMissing && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
                <TriangleAlert size={13} strokeWidth={2} className="shrink-0" />
                Egzersiz adı gerekli — kartı kaydedip daraltmak için bir isim
                gir.
              </p>
            )}

            <div className="mt-2.5 flex flex-col gap-1 rounded-2xl bg-black/20 p-1.5 ring-1 ring-zinc-800/70">
              <div
                className={`${ROW_GRID} px-2 pb-1.5 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400`}
              >
                <span>SET</span>
                <span className={headerCls("weight", "text-zinc-400")}>
                  <Weight size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-bold">KG</span>
                </span>
                <span className={headerCls("reps", "text-zinc-400")}>
                  <Repeat size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-bold">TKR</span>
                </span>
                <span
                  title="Dinlenme (sn)"
                  className={`flex items-center justify-center gap-1 transition-colors ${
                    focusedField === "rest"
                      ? "text-amber-300"
                      : "text-amber-300/70"
                  }`}
                >
                  <Timer size={12} strokeWidth={2.5} />
                  <span className="text-[9px] font-bold">sn</span>
                </span>
              </div>

              {exercise.sets.map((set, i) => {
                const weightMissing = attempted && set.weight.trim() === "";
                const repsMissing = attempted && !(Number(set.reps) > 0);
                const restMissing =
                  attempted && String(set.rest ?? "").trim() === "";
                const err =
                  "border-red-400/60 focus:border-red-400 focus:ring-red-400/30";
                const last = i === exercise.sets.length - 1;
                return (
                  <div
                    key={i}
                    className={`${ROW_GRID} rounded-xl px-2 py-0.5 transition-colors hover:bg-zinc-800/25`}
                  >
                    <span className="text-sm font-bold tabular-nums text-zinc-500">
                      {i + 1}
                    </span>

                    <label className="relative block">
                      <input
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="next"
                        placeholder="0"
                        value={set.weight}
                        onChange={(e) =>
                          onUpdateSetWeight(exercise.id, i, e.target.value)
                        }
                        aria-label={`Set ${i + 1} ağırlık`}
                        aria-invalid={weightMissing}
                        onFocus={() => setFocusedField("weight")}
                        onBlur={() => setFocusedField((f) => (f === "weight" ? null : f))}
                        style={{ paddingLeft: "1rem", paddingRight: "1.75rem" }}
                        className={`${inputBase} ${
                          weightMissing
                            ? err
                            : "border-zinc-700/50 focus:border-lime-400/50 focus:ring-lime-500/40"
                        }`}
                      />
                      <span className={unitCls}>kg</span>
                    </label>

                    <label className="relative block">
                      <input
                        type="text"
                        inputMode="numeric"
                        enterKeyHint={last ? "done" : "next"}
                        placeholder="–"
                        value={set.reps || ""}
                        onChange={(e) =>
                          onUpdateSetRep(exercise.id, i, e.target.value)
                        }
                        aria-label={`Set ${i + 1} tekrar`}
                        aria-invalid={repsMissing}
                        onFocus={() => setFocusedField("reps")}
                        onBlur={() => setFocusedField((f) => (f === "reps" ? null : f))}
                        style={{ paddingLeft: "1rem", paddingRight: "1.75rem" }}
                        className={`${inputBase} ${
                          repsMissing
                            ? err
                            : "border-zinc-700/50 focus:border-lime-400/50 focus:ring-lime-500/40"
                        }`}
                      />
                      <span className={unitCls}>tkr</span>
                    </label>

                    <label className="relative block">
                      <input
                        type="text"
                        inputMode="numeric"
                        enterKeyHint={last ? "done" : "next"}
                        placeholder="60"
                        value={set.rest || ""}
                        onChange={(e) =>
                          onUpdateSetRest(exercise.id, i, e.target.value)
                        }
                        aria-label={`Set ${i + 1} dinlenme saniye`}
                        aria-invalid={restMissing}
                        onFocus={() => setFocusedField("rest")}
                        onBlur={() => setFocusedField((f) => (f === "rest" ? null : f))}
                        style={{ paddingLeft: "1rem", paddingRight: "1.75rem" }}
                        className={`${inputBase} ${
                          restMissing
                            ? err
                            : "border-amber-400/20 focus:border-amber-400/60 focus:ring-amber-400/40"
                        }`}
                      />
                      <span className={unitCls}>sn</span>
                    </label>
                  </div>
                );
              })}
            </div>

<div
              data-tour="history"
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                prevExercise ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
              aria-hidden={!prevExercise}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`transition-opacity duration-300 ease-in-out ${
                    prevExercise
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                >
                  <div className="mt-2.5 rounded-2xl bg-black/20 p-1.5 ring-1 ring-zinc-800/70">
                    <div className={`${ROW_GRID} px-2 pb-1.5 pt-0.5`}>
                      <span className="col-span-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        <History size={13} strokeWidth={2} />
                        Geçen hafta · {prevLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {prevExercise?.sets.map((s, i) => {
                        const w = String(s?.weight ?? "").trim();
                        const r = s?.reps ?? 0;
                        const rest = String(s?.rest ?? "").trim();
                        return (
                          <div
                            key={i}
                            className={`${ROW_GRID} rounded-lg px-2 py-0.5 transition-colors hover:bg-zinc-800/25`}
                          >
                            <span className="text-sm font-bold tabular-nums text-zinc-500">
                              {i + 1}
                            </span>
                            <span className="truncate text-center text-xs font-medium tabular-nums text-zinc-500">
                              {w ? `${w} kg` : "—"}
                            </span>
                            <span className="truncate text-center text-xs font-medium tabular-nums text-zinc-500">
                              {r || "—"}
                            </span>
                            <span className="truncate text-center text-xs font-medium tabular-nums text-zinc-500">
                              {rest ? `${rest} sn` : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {attempted && emptyIndexes.length > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
                <CircleAlert size={13} strokeWidth={2} className="shrink-0" />
                Boş alanlar var — tüm setlerde ağırlık, tekrar ve dinlenme
                süresini doldur.
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddSet(exercise.id)}
                disabled={atMaxSets}
                className="flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700/80 text-xs font-semibold text-zinc-400 transition hover:border-lime-400/60 hover:bg-lime-400/5 hover:text-lime-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-700/80 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
              >
                <Plus size={14} strokeWidth={2.5} />
                Set Ekle
              </button>
              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(exercise.id)}
                  aria-label="Son seti sil"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-700/60 text-zinc-400 transition hover:border-red-400/60 hover:text-red-300 active:scale-95"
                >
                  <X size={15} strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                data-tour="save"
                className="h-9 shrink-0 rounded-xl bg-lime-400 px-5 text-sm font-medium text-black shadow-lg shadow-lime-500/10 transition hover:bg-lime-300 active:scale-[0.98]"
              >
                Kaydet
              </button>
              {!confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Egzersizi sil"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400 active:scale-95"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              )}
            </div>

            {confirmDelete ? (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-red-400/30 bg-red-400/5 px-3 py-2">
                <span className="text-[11px] font-semibold text-red-300">
                  Bu egzersiz silinsin mi?
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="h-8 shrink-0 rounded-lg bg-zinc-800 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-700 active:scale-95"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(exercise.id)}
                    className="h-8 shrink-0 rounded-lg bg-red-400 px-3 text-xs font-bold text-zinc-950 transition hover:bg-red-300 active:scale-95"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-zinc-600">
                {atMaxSets
                  ? `En fazla ${MAX_SETS} set eklenebilir.`
                  : "\u00A0"}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Toast({ message, tone = "success", onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const hideTimer = setTimeout(() => setVisible(false), 2600);
    const doneTimer = setTimeout(onDone, 3050);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const toneClasses =
    tone === "danger"
      ? "bg-red-500 text-red-950 shadow-red-500/40 ring-red-300/50"
      : "bg-emerald-500 text-emerald-950 shadow-emerald-500/30 ring-emerald-300/50";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 px-4">
      <div
        className={`mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl ring-1 transition-all duration-300 ease-out ${toneClasses} ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0"
        }`}
        role="status"
        aria-live="polite"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            className={
              tone === "danger" ? "fill-red-600/30" : "fill-emerald-600/30"
            }
          />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="min-w-0 truncate">{message}</span>
      </div>
    </div>
  );
}

function TutorialPrompt({ onConfirm, onSkip }) {
  const [never, setNever] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/40"
        style={{ animation: "promptPop .3s ease-out" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-prompt-title"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/20">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div>
            <h2
              id="tutorial-prompt-title"
              className="text-base font-bold leading-snug text-zinc-100"
            >
              Uygulamanın nasıl kullanıldığını öğrenmek ister misiniz?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Kısa bir turla adım adım göstereceğiz; istediğin an çıkabilirsin.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onConfirm(never)}
            aria-label="Evet, öğrenmek istiyorum"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
          >
            <Check size={26} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => onSkip(never)}
            aria-label="Hayır, şimdilik istemiyorum"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-400 active:scale-95"
          >
            <X size={26} strokeWidth={3} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setNever((v) => !v)}
          aria-pressed={never}
          className="mx-auto mt-5 flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
        >
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              never ? "bg-lime-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                never ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </span>
          Bir daha bu kutuyu gösterme
        </button>
      </div>
    </div>
  );
}

function TourOverlay({ steps, onEnd }) {
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tip, setTip] = useState(null);
  const tipRef = useRef(null);

  useEffect(() => {
    const available = steps.filter((s) => {
      const el = document.querySelector(s.selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.height > 4 && r.width > 4;
    });
    // oxlint-disable-next-line react/set-state-in-effect
    setList(available);
  }, [steps]);

  const stepIndex = Math.min(index, Math.max(list.length - 1, 0));
  const activeStep = list[stepIndex];

  useEffect(() => {
    if (!activeStep) return;
    const el = document.querySelector(activeStep.selector);
    if (!el) return;
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [activeStep]);

  useLayoutEffect(() => {
    if (!rect || !tipRef.current) return;
    const t = tipRef.current.getBoundingClientRect();
    const pad = 12;
    const place =
      rect.bottom + t.height + pad > window.innerHeight - 8 ? "top" : "bottom";
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - t.width / 2, 8),
      Math.max(8, window.innerWidth - t.width - 8)
    );
    const top =
      place === "bottom"
        ? rect.bottom + pad
        : Math.max(8, rect.top - pad - t.height);
    setTip({ left, top, place });
  }, [rect, stepIndex, list]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onEnd();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, list.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnd, list.length]);

  if (!activeStep) return null;

  const isLast = stepIndex === list.length - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div
        className="pointer-events-none fixed transition-all duration-300 ease-out"
        style={{
          left: rect ? rect.left - 8 : 0,
          top: rect ? rect.top - 8 : 0,
          width: rect ? rect.width + 16 : 0,
          height: rect ? rect.height + 16 : 0,
          borderRadius: 18,
          boxShadow: rect
            ? "0 0 0 9999px rgba(9,9,11,.82), 0 0 0 2px rgba(163,230,53,.55)"
            : "none",
        }}
      />

      <div
        ref={tipRef}
        role="dialog"
        aria-modal="true"
        className="pointer-events-auto fixed z-10 w-[min(88vw,320px)] rounded-2xl border border-zinc-700/60 bg-zinc-900 p-4 shadow-2xl shadow-black/50"
        style={{
          left: tip?.left ?? 0,
          top: tip?.top ?? 0,
          visibility: tip ? "visible" : "hidden",
          animation: "tourPop .28s ease-out",
        }}
      >
        <span
          className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-zinc-700/60 bg-zinc-900 ${
            tip?.place === "top"
              ? "-bottom-1.5 border-b border-r"
              : "-top-1.5 border-l border-t"
          }`}
        />

        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-lime-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lime-400 ring-1 ring-lime-500/20">
            {stepIndex + 1} / {list.length}
          </span>
          <button
            type="button"
            onClick={onEnd}
            aria-label="Turu kapat"
            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <h3 className="mt-2 text-sm font-bold text-zinc-100">
          {activeStep.title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
          {activeStep.body}
        </p>

        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={stepIndex === 0}
            className="flex h-8 items-center gap-1 rounded-lg border border-zinc-700/60 px-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            Geri
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {list.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-4 bg-lime-400" : "w-1.5 bg-zinc-600"
                }`}
              />
            ))}
          </div>
          {isLast ? (
            <button
              type="button"
              onClick={onEnd}
              className="h-8 rounded-lg bg-lime-400 px-3.5 text-xs font-bold text-black shadow-lg shadow-lime-500/20 transition hover:bg-lime-300"
            >
              Bitir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(i + 1, list.length - 1))}
              className="flex h-8 items-center gap-1 rounded-lg bg-lime-400 px-3 text-xs font-bold text-black shadow-lg shadow-lime-500/20 transition hover:bg-lime-300"
            >
              İleri
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;