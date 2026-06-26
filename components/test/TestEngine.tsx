"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { AlertTriangle, Flag, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  options: string[];
  topic: string;
  difficulty: string;
  marks: number;
}

interface SavedAnswer {
  questionId: string;
  selectedOptions: number[];
}

interface TestEngineProps {
  testId: string;
  attemptId: string;
  questions: Question[];
  startedAt: string;
  durationMins: number;
  initialAnswers: SavedAnswer[];
}

type PaletteState = "unanswered" | "answered" | "review";

export function TestEngine({ testId, attemptId, questions, startedAt, durationMins, initialAnswers }: TestEngineProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number[]>>(() => {
    const m = new Map<string, number[]>();
    initialAnswers.forEach((a) => m.set(a.questionId, a.selectedOptions as number[]));
    return m;
  });
  const [markedReview, setMarkedReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationMins * 60 - elapsed);
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const saveQueue = useRef<Map<string, number[]>>(new Map());
  const savingRef = useRef(false);

  const current = questions[currentIdx];

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(id); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fullscreen request
  useEffect(() => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Autosave flush
  const flushSave = useCallback(async () => {
    if (savingRef.current || saveQueue.current.size === 0) return;
    savingRef.current = true;
    const entries = [...saveQueue.current.entries()];
    saveQueue.current.clear();
    for (const [questionId, selectedOptions] of entries) {
      try {
        await fetch(`/api/tests/${testId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedOptions }),
        });
      } catch { /* silent */ }
    }
    savingRef.current = false;
  }, [testId]);

  useEffect(() => {
    const id = setInterval(flushSave, 5000);
    return () => clearInterval(id);
  }, [flushSave]);

  function selectOption(optionIdx: number) {
    const qId = current.id;
    const prev = answers.get(qId) || [];
    // Single-correct: toggle or replace
    const next = prev.includes(optionIdx) ? [] : [optionIdx];
    setAnswers((m) => new Map(m).set(qId, next));
    saveQueue.current.set(qId, next);
  }

  function toggleReview() {
    const qId = current.id;
    setMarkedReview((s) => {
      const n = new Set(s);
      n.has(qId) ? n.delete(qId) : n.add(qId);
      return n;
    });
  }

  function getPaletteState(q: Question): PaletteState {
    if (markedReview.has(q.id)) return "review";
    if ((answers.get(q.id) || []).length > 0) return "answered";
    return "unanswered";
  }

  async function handleSubmit(auto = false) {
    if (submitting) return;
    setSubmitting(true);
    // Flush any unsaved answers
    await flushSave();
    try {
      const res = await fetch(`/api/tests/${testId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok && !data.alreadySubmitted) {
        toast.error("Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      if (auto) toast.info("Time up — your test has been submitted.");
      router.push(`/student/tests/${testId}/result`);
    } catch {
      toast.error("Network error during submission.");
      setSubmitting(false);
    }
  }

  const answered = questions.filter((q) => (answers.get(q.id) || []).length > 0).length;
  const unanswered = questions.length - answered;

  const timerClass =
    timeLeft > 300
      ? "timer-normal"
      : timeLeft > 60
      ? "timer-warning"
      : "timer-danger";

  const selectedOpts = answers.get(current.id) || [];
  const isReview = markedReview.has(current.id);

  return (
    <div className="fixed inset-0 bg-[hsl(var(--bg))] flex flex-col overflow-hidden">
      {/* Header bar */}
      <header className="bg-white border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[hsl(var(--brand))] rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-[hsl(var(--text-primary))] max-w-xs truncate">
            {/* Title comes from parent */}
            Assessment in Progress
          </h1>
        </div>

        {/* Timer */}
        <div className={cn("flex items-center gap-1.5 text-sm font-mono font-semibold", timerClass)}>
          <Clock size={15} />
          {formatTime(timeLeft)}
          {timeLeft <= 300 && (
            <span className="text-xs font-normal ml-1">remaining</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[hsl(var(--text-muted))]">
            {answered}/{questions.length} answered
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={submitting}
          >
            <Send size={14} />
            Submit test
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
          {/* Question header */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="badge-neutral">{current.topic}</span>
              <span className={cn("badge",
                current.difficulty === "EASY" ? "badge-success" :
                current.difficulty === "MEDIUM" ? "badge-warning" : "badge-error"
              )}>
                {current.difficulty}
              </span>
              <span className="text-xs text-[hsl(var(--text-muted))]">{current.marks} mark{current.marks !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Question text */}
          <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-6 mb-5 shadow-sm">
            <p className="text-[15px] leading-7 text-[hsl(var(--text-primary))] font-medium">
              {current.text}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {current.options.map((opt, i) => {
              const selected = selectedOpts.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  className={cn(
                    "w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer",
                    selected
                      ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]"
                      : "border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--brand)/0.4)] hover:bg-[hsl(var(--brand-light)/0.5)]"
                  )}
                  aria-pressed={selected}
                  aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt}`}
                >
                  <span className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all",
                    selected
                      ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white"
                      : "border-[hsl(var(--border))] text-[hsl(var(--text-muted))]"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className={cn(
                    "text-sm leading-relaxed",
                    selected ? "text-[hsl(var(--brand-dark))] font-medium" : "text-[hsl(var(--text-primary))]"
                  )}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft size={15} /> Previous
            </Button>

            <button
              onClick={toggleReview}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors",
                isReview
                  ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                  : "text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-2))]"
              )}
            >
              <Flag size={13} />
              {isReview ? "Marked for review" : "Mark for review"}
            </button>

            <Button
              variant={currentIdx === questions.length - 1 ? "primary" : "outline"}
              size="sm"
              onClick={() =>
                currentIdx === questions.length - 1
                  ? setShowSubmitConfirm(true)
                  : setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
              }
            >
              {currentIdx === questions.length - 1 ? (
                <><Send size={14} /> Submit</>
              ) : (
                <>Next <ChevronRight size={15} /></>
              )}
            </Button>
          </div>
        </div>

        {/* Palette panel */}
        <aside className="w-64 shrink-0 bg-white border-l border-[hsl(var(--border))] p-5 overflow-y-auto">
          <h2 className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wide mb-4">
            Question Palette
          </h2>

          {/* Legend */}
          <div className="space-y-1.5 mb-5">
            {[
              { cls: "palette-btn-answered", label: `Answered (${answered})` },
              { cls: "palette-btn-unanswered", label: `Not answered (${unanswered})` },
              { cls: "palette-btn-review", label: `Marked for review (${markedReview.size})` },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded border", l.cls.replace("palette-btn-", ""))} />
                <span className="text-xs text-[hsl(var(--text-muted))]">{l.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const state = getPaletteState(q);
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === currentIdx ? "true" : undefined}
                  className={cn(
                    state === "answered" ? "palette-btn-answered" :
                    state === "review" ? "palette-btn-review" :
                    "palette-btn-unanswered",
                    i === currentIdx && "ring-2 ring-[hsl(var(--brand))] ring-offset-1"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-[hsl(var(--border))]">
            {unanswered > 0 && (
              <div className="flex items-start gap-2 bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] rounded-lg p-3 mb-4">
                <AlertTriangle size={14} className="text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                <p className="text-xs text-[hsl(var(--warning))]">
                  {unanswered} question{unanswered !== 1 ? "s" : ""} unanswered
                </p>
              </div>
            )}
            <Button
              variant="primary"
              className="w-full"
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              loading={submitting}
            >
              <Send size={14} />
              Submit test
            </Button>
          </div>
        </aside>
      </div>

      {/* Submit confirm dialog */}
      <ConfirmDialog
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => handleSubmit(false)}
        title="Submit test?"
        description={
          unanswered > 0
            ? `You have ${unanswered} unanswered question${unanswered !== 1 ? "s" : ""}. Once submitted, you cannot change your answers.`
            : "Once submitted, you cannot change your answers. Are you sure?"
        }
        confirmLabel="Yes, submit"
        variant="primary"
        loading={submitting}
      />
    </div>
  );
}
