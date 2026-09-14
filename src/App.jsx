import { useEffect, useState } from "react";

const STORAGE_KEY = "workout-data-v1";
const DEFAULT_REST = 120;
const MAX_SETS = 6;
const ROW_GRID =
  "grid grid-cols-[1.5rem_1fr_3rem_3rem_3.5rem] items-center gap-1";

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

const getEmoji = (name) => {
  const n = name.toLowerCase();
  if (n.includes("göğüs") || n.includes("gogus")) return "🏋️";
  if (n.includes("sırt") || n.includes("sirt")) return "🧗";
  if (n.includes("omuz")) return "🤸";
  if (n.includes("biceps") || n.includes("triceps") || n.includes("kol")) return "💪";
  if (n.includes("leg") || n.includes("bacak") || n.includes("curl")) return "🦵";
  return "🏋️";
};

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

const fmtPrev = (row) => {
  if (!row) return "—";
  const w = String(row.weight ?? "").trim();
  const r = row.reps ?? 0;
  if (!w && !r) return "—";
  return `${w}${w ? " kg" : ""} × ${r}`;
};

function App() {
  const [data, setData] = useState(loadData);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(getTodayIndex());
  const [toast, setToast] = useState(null);

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

  const removeExercise = (id) =>
    setExercises((prev) => prev.filter((ex) => ex.id !== id));

  const notifySave = (name) =>
    setToast({
      id: Date.now(),
      message: `${name} isimli hareket başarıyla kaydedildi.`,
    });

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
        return { ...ex, sets: [...ex.sets, createSet()] };
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

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100 antialiased">
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
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

        <div className="mt-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-3 shadow-xl shadow-black/20 backdrop-blur">
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
              const matched =
                exercise.name.trim() !== ""
                  ? prevExercises.find(
                      (p) =>
                        p.name.trim().toLowerCase() ===
                        exercise.name.trim().toLowerCase()
                    )
                  : undefined;
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  accent={ACCENTS[index % ACCENTS.length]}
                  prevRows={matched ? matched.sets : []}
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
  accent,
  prevRows,
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

  const active = nameMissing
    ? {
        chip: "bg-lime-400/10 text-lime-300 ring-lime-400/25",
      }
    : accent;
  const emoji = getEmoji(exercise.name);

  const handleSave = () => {
    setAttempted(true);
    if (canSave) {
      setCollapsed(true);
      onSave(exercise.name);
    }
  };

  return (
    <section
      className={`rounded-3xl border p-3 shadow-xl shadow-black/30 transition-colors ${
        nameMissing
          ? "border-lime-400/30 bg-gradient-to-b from-lime-400/[0.08] to-zinc-900/60"
          : "border-zinc-800/80 bg-gradient-to-b from-zinc-800/50 to-zinc-900/60"
      }`}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex w-full items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left transition hover:bg-zinc-800/50"
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${active.chip}`}
          >
            {emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-zinc-100">
              {exercise.name}
            </span>
            <span className="block text-[10px] font-medium text-zinc-500">
              {exercise.sets.length} set
            </span>
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-zinc-500"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${active.chip}`}
          >
            {emoji}
          </span>
          <input
            type="text"
            placeholder="Egzersiz adı (örn. Göğüs Fly)"
            enterKeyHint="next"
            value={exercise.name}
            onChange={(e) => onUpdateName(exercise.id, e.target.value)}
            aria-invalid={nameMissing}
            className="h-10 min-w-0 flex-1 rounded-xl border bg-zinc-800/70 px-3 text-sm font-semibold text-zinc-100 placeholder:font-medium placeholder:text-zinc-500 focus:outline-none focus:ring-2"
            style={{
              borderColor: attempted && nameMissing ? "#fbbf24" : undefined,
            }}
          />
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Kartı daralt"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200 active:scale-95"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        </div>
      )}

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
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Egzersiz adı gerekli — kartı kaydedip daraltmak için bir isim
                gir.
              </p>
            )}

            <div className="mt-2.5 flex flex-col gap-1 rounded-2xl bg-black/20 p-1.5 ring-1 ring-zinc-800/70">
              <div
                className={`${ROW_GRID} px-2 pb-1 pt-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500`}
              >
                <span>SET</span>
                <span>Geçen Hafta</span>
                <span className="text-center">KG</span>
                <span className="text-center">TKR</span>
                <span
                  title="Dinlenme (sn)"
                  className="flex justify-center text-amber-300/90"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 22h14" />
                    <path d="M5 2h14" />
                    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                  </svg>
                </span>
              </div>

              {exercise.sets.map((set, i) => {
                const weightMissing = attempted && set.weight.trim() === "";
                const repsMissing = attempted && !(Number(set.reps) > 0);
                const restMissing =
                  attempted && String(set.rest ?? "").trim() === "";
                const invalidCls =
                  "border-red-400/70 focus:border-red-400 focus:ring-red-400/30";
                return (
                  <div
                    key={i}
                    className={`${ROW_GRID} rounded-xl px-2 py-1 transition-colors`}
                  >
                    <span className="text-sm font-bold tabular-nums text-zinc-400">
                      {i + 1}
                    </span>

                    <span className="truncate text-[11px] font-medium tabular-nums text-zinc-500">
                      {fmtPrev(prevRows[i])}
                    </span>

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
                      className={`h-9 w-full min-w-0 rounded-lg border bg-zinc-800/70 px-1 text-center text-sm font-bold tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                        weightMissing
                          ? invalidCls
                          : "border-zinc-700 focus:border-lime-400 focus:ring-lime-400/40"
                      }`}
                    />

                    <input
                      type="text"
                      inputMode="numeric"
                      enterKeyHint={
                        i === exercise.sets.length - 1 ? "done" : "next"
                      }
                      placeholder="–"
                      value={set.reps || ""}
                      onChange={(e) =>
                        onUpdateSetRep(exercise.id, i, e.target.value)
                      }
                      aria-label={`Set ${i + 1} tekrar`}
                      aria-invalid={repsMissing}
                      className={`h-9 w-full min-w-0 rounded-lg border bg-zinc-800/70 px-1 text-center text-sm font-bold tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                        repsMissing
                          ? invalidCls
                          : "border-zinc-700 focus:border-lime-400 focus:ring-lime-400/40"
                      }`}
                    />

                    <input
                      type="text"
                      inputMode="numeric"
                      enterKeyHint={
                        i === exercise.sets.length - 1 ? "done" : "next"
                      }
                      placeholder="60"
                      value={set.rest || ""}
                      onChange={(e) =>
                        onUpdateSetRest(exercise.id, i, e.target.value)
                      }
                      aria-label={`Set ${i + 1} dinlenme saniye`}
                      aria-invalid={restMissing}
                      className={`h-9 w-full min-w-0 rounded-lg border bg-zinc-800/70 px-1 text-center text-sm font-semibold tabular-nums text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                        restMissing
                          ? invalidCls
                          : "border-amber-400/20 focus:border-amber-400 focus:ring-amber-400/40"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {attempted && emptyIndexes.length > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-300/90">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Boş alanlar var — tüm setlerde ağırlık, tekrar ve dinlenme
                süresini doldur.
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddSet(exercise.id)}
                disabled={atMaxSets}
                className="h-9 flex-1 rounded-xl border border-dashed border-zinc-700 text-xs font-semibold text-zinc-300 transition hover:border-lime-400 hover:bg-lime-400/5 hover:text-lime-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-700 disabled:hover:bg-transparent disabled:hover:text-zinc-300"
              >
                + Set Ekle
              </button>
              {exercise.sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(exercise.id)}
                  aria-label="Son seti sil"
                  className="h-9 w-9 shrink-0 rounded-xl border border-zinc-700 text-lg text-zinc-400 transition hover:border-red-400 hover:text-red-300 active:scale-95"
                >
                  −
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="h-9 shrink-0 rounded-xl bg-lime-400 px-4 text-xs font-bold text-zinc-950 shadow-lg shadow-lime-400/20 transition hover:bg-lime-300 active:scale-[0.98]"
              >
                Kaydet
              </button>
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
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">
                  {atMaxSets
                    ? `En fazla ${MAX_SETS} set eklenebilir.`
                    : "\u00A0"}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Egzersizi sil"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Toast({ message, onDone }) {
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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 px-4">
      <div
        className={`mx-auto flex w-fit max-w-full items-center gap-2.5 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-2xl shadow-emerald-500/30 ring-1 ring-emerald-300/50 transition-all duration-300 ease-out ${
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
          <circle cx="12" cy="12" r="10" className="fill-emerald-600/30" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="min-w-0 truncate">{message}</span>
      </div>
    </div>
  );
}

export default App;