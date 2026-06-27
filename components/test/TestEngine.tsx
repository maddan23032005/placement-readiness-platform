"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, AlertDialog } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { AlertTriangle, Flag, ChevronLeft, ChevronRight, Clock, Send, Camera, Play, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Editor } from "@monaco-editor/react";

interface Question {
  id: string;
  type?: "MCQ" | "CODING";
  text?: string;
  options?: string[];
  title?: string;
  description?: string;
  language?: string;
  starterCode?: string;
  testCases?: Array<{ input: string; isHidden: boolean; expectedOutput?: string }>;
  topic: string;
  difficulty: string;
  marks: number;
}

interface SavedAnswer {
  questionId: string;
  selectedOptions: number[];
}

interface SavedCodingAnswer {
  questionId: string;
  submittedCode: string;
  testCaseResults: any[];
}

interface TestEngineProps {
  testId: string;
  attemptId: string;
  questions: Question[];
  startedAt: string;
  durationMins: number;
  initialAnswers: SavedAnswer[];
  initialCodingAnswers?: SavedCodingAnswer[];
}

type PaletteState = "unanswered" | "answered" | "review";

export function TestEngine({ testId, attemptId, questions, startedAt, durationMins, initialAnswers, initialCodingAnswers }: TestEngineProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number[]>>(() => {
    const m = new Map<string, number[]>();
    initialAnswers.forEach((a) => m.set(a.questionId, a.selectedOptions as number[]));
    return m;
  });
  
  const [codingAnswers, setCodingAnswers] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    questions.forEach(q => {
      if (q.type === "CODING") m.set(q.id, q.starterCode || "");
    });
    initialCodingAnswers?.forEach((a) => {
      if (a.submittedCode) m.set(a.questionId, a.submittedCode);
    });
    return m;
  });

  const [codingResults, setCodingResults] = useState<Map<string, any[]>>(() => {
    const m = new Map<string, any[]>();
    initialCodingAnswers?.forEach((a) => {
      if (a.testCaseResults) m.set(a.questionId, a.testCaseResults);
    });
    return m;
  });
  
  const [runningCode, setRunningCode] = useState(false);
  const [markedReview, setMarkedReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, durationMins * 60 - elapsed);
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Proctoring states
  const [warningsCount, setWarningsCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isHandlingViolation = useRef(false);

  const saveQueue = useRef<Map<string, number[]>>(new Map());
  const saveCodingQueue = useRef<Map<string, string>>(new Map());
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

  // Camera & Mic access
  useEffect(() => {
    let streamRef: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMediaStream(stream);
        streamRef = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        toast.error("Camera/Microphone access is required for proctoring.");
      });
      
    return () => {
      streamRef?.getTracks().forEach((track) => track.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave flush
  const flushSave = useCallback(async () => {
    if (savingRef.current || (saveQueue.current.size === 0 && saveCodingQueue.current.size === 0)) return;
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

    const cEntries = [...saveCodingQueue.current.entries()];
    saveCodingQueue.current.clear();
    for (const [questionId, submittedCode] of cEntries) {
      try {
        await fetch(`/api/tests/${testId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, submittedCode }),
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

  function handleCodeChange(val: string | undefined) {
    const qId = current.id;
    const code = val || "";
    setCodingAnswers((m) => new Map(m).set(qId, code));
    saveCodingQueue.current.set(qId, code);
  }

  async function runCode() {
    const qId = current.id;
    const code = codingAnswers.get(qId);
    if (!code) return;
    
    setRunningCode(true);
    try {
      const res = await fetch(`/api/tests/${testId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: qId, code, language: current.language }),
      });
      const data = await res.json();
      if (data.results) {
        setCodingResults((m) => new Map(m).set(qId, data.results));
        toast.success("Code execution complete");
      }
    } catch {
      toast.error("Execution failed");
    } finally {
      setRunningCode(false);
    }
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
    if (q.type === "CODING") {
      const code = codingAnswers.get(q.id);
      if (code && code !== q.starterCode) return "answered";
    } else {
      if ((answers.get(q.id) || []).length > 0) return "answered";
    }
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
        toast.error(data.error || "Submission failed. Please try again.");
        if (data.stack) console.error("Submit Error:", data.stack);
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

  const handleViolation = useCallback((reason: string) => {
    if (isHandlingViolation.current || submitting) return;
    isHandlingViolation.current = true;
    
    setWarningMessage(reason);
    setWarningsCount((prev) => prev + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  useEffect(() => {
    if (warningsCount > 0 && warningsCount < 4) {
      setWarningMessage(prev => `Proctoring Violation (${warningsCount}/3): ${prev}. On the 4th violation, your test will be auto-submitted.`);
      setShowWarningModal(true);
    } else if (warningsCount >= 4) {
      toast.error("Test auto-submitted due to multiple proctoring violations.");
      handleSubmit(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warningsCount]);

  // Fullscreen and Visibility request
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation("You switched tabs or minimized the window");
      }
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitting) {
        handleViolation("You exited full-screen mode");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleViolation, submitting]);

  const answered = questions.filter((q) => getPaletteState(q) === "answered").length;
  const unanswered = questions.length - answered;

  const timerClass =
    timeLeft > 300
      ? "timer-normal"
      : timeLeft > 60
      ? "timer-warning"
      : "timer-danger";

  const selectedOpts = answers.get(current.id) || [];
  const isReview = markedReview.has(current.id);
  const currentResults = codingResults.get(current.id);

  return (
    <div className="fixed inset-0 z-[100] bg-[hsl(var(--bg))] flex flex-col overflow-hidden">
      {/* Header bar */}
      <header className="bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[hsl(var(--brand))] rounded flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-[hsl(var(--text-primary))] max-w-[150px] md:max-w-xs truncate">
            Assessment in Progress
          </h1>
        </div>

        {/* Timer */}
        <div suppressHydrationWarning className={cn("flex items-center gap-1.5 text-sm font-mono font-semibold", timerClass)}>
          <Clock size={15} />
          {formatTime(timeLeft)}
          {timeLeft <= 300 && (
            <span className="text-xs font-normal ml-1 hidden md:inline">remaining</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-[hsl(var(--border))] pt-2 md:pt-0 mt-1 md:mt-0">
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Question panel */}
        <div className={cn("flex-1 lg:overflow-y-auto p-4 lg:p-8 mx-auto w-full", current.type === "CODING" ? "max-w-[1400px]" : "max-w-3xl")}>
          {/* Question header */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-[hsl(var(--text-muted))] uppercase tracking-wide">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <div className="flex items-center gap-2">
              <span className="badge-neutral hidden sm:inline-flex">{current.topic}</span>
              <span className={cn("badge",
                current.difficulty === "EASY" ? "badge-success" :
                current.difficulty === "MEDIUM" ? "badge-warning" : "badge-error"
              )}>
                {current.difficulty}
              </span>
              <span className="text-xs text-[hsl(var(--text-muted))]">{current.marks} mark{current.marks !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {current.type !== "CODING" ? (
            <>
              {/* Question text */}
              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-4 lg:p-6 mb-5 shadow-sm">
                <p className="text-[15px] leading-7 text-[hsl(var(--text-primary))] font-medium">
                  {current.text}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {current.options?.map((opt, i) => {
                  const selected = selectedOpts.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => selectOption(i)}
                      className={cn(
                        "w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer",
                        selected
                          ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]"
                          : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--brand)/0.4)] hover:bg-[hsl(var(--brand-light)/0.5)]"
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
            </>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-240px)] mb-6">
              {/* Problem Description */}
              <div className="flex-1 lg:overflow-y-auto bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl p-4 lg:p-6 shadow-sm min-h-[300px]">
                <h2 className="text-xl font-bold mb-4">{current.title}</h2>
                <div className="prose max-w-none text-sm text-[hsl(var(--text-primary))] whitespace-pre-wrap">
                  {current.description}
                </div>
                
                {/* Test cases result preview */}
                {currentResults && (
                  <div className="mt-8 border-t pt-4">
                    <h3 className="font-bold mb-3">Test Case Results</h3>
                    <div className="space-y-3">
                      {currentResults.map((res: any, idx: number) => (
                        <div key={idx} className={cn("p-3 rounded-md border text-sm", res.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                          <div className="flex items-center gap-2 mb-2 font-medium">
                            {res.passed ? <CheckCircle2 size={16} className="text-green-600"/> : <XCircle size={16} className="text-red-600"/>}
                            Test Case {idx + 1} {res.isHidden ? "(Hidden)" : ""}
                          </div>
                          {!res.isHidden && !res.passed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 font-mono text-xs text-gray-700 bg-[hsl(var(--surface-2))] p-2 rounded overflow-x-auto">
                              <div>
                                <div className="font-semibold text-gray-500 mb-1">Expected:</div>
                                <div className="whitespace-pre">{res.expectedOutput}</div>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-500 mb-1">Actual:</div>
                                <div className="whitespace-pre">{res.actualOutput}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Editor */}
              <div className="flex-1 flex flex-col bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <span className="font-mono text-xs font-semibold text-gray-600 px-2 py-1 bg-gray-200 rounded">{current.language}</span>
                  <Button size="sm" onClick={runCode} loading={runningCode} className="h-8">
                    <Play size={14} className="mr-1" /> Run Code
                  </Button>
                </div>
                <div className="flex-1 relative">
                  <Editor
                    height="100%"
                    language={current.language === "c++" ? "cpp" : current.language}
                    value={codingAnswers.get(current.id)}
                    onChange={handleCodeChange}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                    theme="vs-dark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8 lg:mb-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft size={15} /> <span className="hidden sm:inline">Previous</span>
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
                <><span className="hidden sm:inline">Next</span> <ChevronRight size={15} /></>
              )}
            </Button>
          </div>
        </div>

        {/* Palette panel */}
        <aside className="w-full lg:w-64 shrink-0 bg-[hsl(var(--surface))] border-t lg:border-t-0 lg:border-l border-[hsl(var(--border))] p-4 lg:p-5 lg:overflow-y-auto flex flex-col">
          <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video relative flex items-center justify-center shrink-0 max-w-[300px] mx-auto w-full">
            {mediaStream ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-white/50" />
            )}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> REC
            </div>
          </div>
          
          <h2 className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wide mb-4">
            Question Palette
          </h2>

          {/* Legend */}
          <div className="space-y-1.5 mb-5 flex flex-wrap gap-x-4 lg:block">
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

          <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-1.5">
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

      <AlertDialog
        open={showWarningModal}
        onClose={() => {
          setShowWarningModal(false);
          isHandlingViolation.current = false;
          if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }}
        title="Proctoring Warning"
        description={warningMessage}
      />

      {/* Start Test Overlay */}
      {!hasStarted && (
        <div className="fixed inset-0 z-[200] bg-[hsl(var(--surface))] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-[hsl(var(--brand-light))] text-[hsl(var(--brand))] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Camera size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-[hsl(var(--text-primary))]">Ready to begin?</h2>
          <p className="text-[hsl(var(--text-muted))] max-w-md mb-8">
            This test requires camera, microphone, and full-screen access. Proctoring will be active. Do not switch tabs or exit full-screen mode.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="text-base px-8 h-12"
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              }
              setHasStarted(true);
            }}
          >
            Start Test & Enter Fullscreen
          </Button>
        </div>
      )}
    </div>
  );
}
