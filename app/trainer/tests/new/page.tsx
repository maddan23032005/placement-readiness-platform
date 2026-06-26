"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  options: string[];
  marks?: number;
}

interface Batch {
  id: string;
  name: string;
}

const STEPS = ["Test Details", "Add Questions", "Assign & Publish"];

export default function CreateTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState("60");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeValue, setNegativeValue] = useState("0.25");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2 state
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<(Question & { marks: number })[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [qTopic, setQTopic] = useState("");
  const [qDiff, setQDiff] = useState("");
  const [qLoading, setQLoading] = useState(false);

  // Step 3 state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [publish, setPublish] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      setQLoading(true);
      const params = new URLSearchParams();
      if (qSearch) params.set("search", qSearch);
      if (qTopic) params.set("topic", qTopic);
      if (qDiff) params.set("difficulty", qDiff);
      const res = await fetch(`/api/questions/mcq?${params}`);
      const data = await res.json();
      setAllQuestions(data.questions || []);
      setQLoading(false);
    }
    if (step === 1) fetchQuestions();
  }, [step, qSearch, qTopic, qDiff]);

  useEffect(() => {
    if (step === 2) {
      fetch("/api/batches")
        .then((r) => r.json())
        .then((d) => setBatches(d.batches || []));
    }
  }, [step]);

  function validateStep0() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!durationMins || Number(durationMins) < 1) errs.durationMins = "Duration must be at least 1 minute";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function toggleQuestion(q: Question) {
    setSelected((prev) => {
      if (prev.find((s) => s.id === q.id)) return prev.filter((s) => s.id !== q.id);
      return [...prev, { ...q, marks: 1 }];
    });
  }

  function updateMarks(qId: string, marks: number) {
    setSelected((prev) => prev.map((q) => q.id === qId ? { ...q, marks } : q));
  }

  function toggleBatch(id: string) {
    setSelectedBatches((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (selectedBatches.length === 0) {
      toast.error("Please assign the test to at least one batch.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          durationMins: Number(durationMins),
          startAt: startAt || undefined,
          endAt: endAt || undefined,
          negativeMarking,
          negativeValue: Number(negativeValue),
          batchIds: selectedBatches,
          questions: selected.map((q, i) => ({ questionId: q.id, marks: q.marks, order: i })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create test");
        setLoading(false);
        return;
      }

      // Publish if requested
      if (publish) {
        await fetch(`/api/tests/${data.test.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED" }),
        });
      }

      toast.success(`Test "${title}" ${publish ? "published" : "saved as draft"} successfully!`);
      router.push("/trainer/tests");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const topics = [...new Set(allQuestions.map((q) => q.topic))];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Test</h1>
          <p className="page-subtitle">Set up a new MCQ assessment</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn(
              "flex items-center gap-2.5 text-sm font-medium transition-colors",
              i < step ? "text-[hsl(var(--brand))]" :
              i === step ? "text-[hsl(var(--text-primary))]" :
              "text-[hsl(var(--text-muted))]"
            )}>
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 shrink-0",
                i < step ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))] text-white" :
                i === step ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]" :
                "border-[hsl(var(--border))] text-[hsl(var(--text-muted))]"
              )}>
                {i < step ? <Check size={13} /> : i + 1}
              </span>
              {s}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("flex-1 h-px mx-3", i < step ? "bg-[hsl(var(--brand))]" : "bg-[hsl(var(--border))]")} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Details */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Test Details</CardTitle></CardHeader>
          <div className="space-y-5">
            <Input id="title" label="Test title *" placeholder="e.g. DSA Mock Test 1"
              value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
            <Textarea id="desc" label="Description (optional)"
              placeholder="Brief description of this test"
              value={description} onChange={setDescription} />
            <div className="grid grid-cols-3 gap-4">
              <Input id="duration" label="Duration (minutes) *" type="number" placeholder="60"
                value={durationMins} onChange={(e) => setDurationMins(e.target.value)} error={errors.durationMins} />
              <Input id="startAt" label="Start date/time" type="datetime-local"
                value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              <Input id="endAt" label="End date/time" type="datetime-local"
                value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <div className="border border-[hsl(var(--border))] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">Negative marking</p>
                  <p className="text-xs text-[hsl(var(--text-muted))]">Deduct marks for incorrect answers</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={negativeMarking}
                  onClick={() => setNegativeMarking((v) => !v)}
                  className={cn(
                    "w-11 h-6 rounded-full border-2 transition-colors relative shrink-0",
                    negativeMarking ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))]" : "bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                  )}
                >
                  <span className={cn(
                    "absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    negativeMarking ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
              {negativeMarking && (
                <Input id="negVal" label="Deduction per wrong answer (fraction of marks)"
                  type="number" placeholder="0.25"
                  value={negativeValue} onChange={(e) => setNegativeValue(e.target.value)} />
              )}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => validateStep0() && setStep(1)}>
              Next <ChevronRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Questions */}
      {step === 1 && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Add Questions</CardTitle>
              <span className="badge-info">{selected.length} selected</span>
            </CardHeader>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
                <input
                  className="field pl-9"
                  placeholder="Search questions..."
                  value={qSearch}
                  onChange={(e) => setQSearch(e.target.value)}
                />
              </div>
              <select className="field w-40" value={qTopic} onChange={(e) => setQTopic(e.target.value)}>
                <option value="">All topics</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="field w-36" value={qDiff} onChange={(e) => setQDiff(e.target.value)}>
                <option value="">All levels</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {qLoading ? (
              <p className="text-sm text-[hsl(var(--text-muted))] text-center py-8">Loading questions...</p>
            ) : allQuestions.length === 0 ? (
              <p className="text-sm text-[hsl(var(--text-muted))] text-center py-8">
                No questions found.{" "}
                <a href="/trainer/questions" className="text-[hsl(var(--brand))] hover:underline">Add some to your bank first.</a>
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {allQuestions.map((q) => {
                  const isSelected = selected.some((s) => s.id === q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected
                          ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--brand)/0.4)]"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                        isSelected ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))]" : "border-[hsl(var(--border))]"
                      )}>
                        {isSelected && <Check size={11} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[hsl(var(--text-primary))] leading-relaxed">{q.text}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="badge-neutral">{q.topic}</span>
                          <span className={cn("badge",
                            q.difficulty === "EASY" ? "badge-success" :
                            q.difficulty === "MEDIUM" ? "badge-warning" : "badge-error"
                          )}>{q.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Marks config */}
          {selected.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Configure Marks</CardTitle></CardHeader>
              <div className="space-y-2">
                {selected.map((q, i) => (
                  <div key={q.id} className="flex items-center gap-3 p-3 bg-[hsl(var(--surface-2))] rounded-lg">
                    <span className="text-xs font-semibold text-[hsl(var(--text-muted))] w-6 text-center">{i + 1}</span>
                    <p className="text-sm flex-1 text-[hsl(var(--text-primary))] truncate">{q.text}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-xs text-[hsl(var(--text-muted))]">Marks:</label>
                      <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={q.marks}
                        onChange={(e) => updateMarks(q.id, Number(e.target.value))}
                        className="field w-16 py-1.5 text-center text-sm"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleQuestion(q); }}
                      className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--error))] transition-colors"
                      aria-label="Remove question"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button
              onClick={() => {
                if (selected.length === 0) { toast.error("Add at least one question."); return; }
                setStep(2);
              }}
            >
              Next <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Assign & Publish */}
      {step === 2 && (
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Assign to Batches</CardTitle></CardHeader>
            {batches.length === 0 ? (
              <p className="text-sm text-[hsl(var(--text-muted))] py-4 text-center">
                No batches found.{" "}
                <a href="/trainer/batches" className="text-[hsl(var(--brand))] hover:underline">Create one first.</a>
              </p>
            ) : (
              <div className="space-y-2">
                {batches.map((b) => {
                  const isSel = selectedBatches.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBatch(b.id)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all",
                        isSel ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--brand)/0.4)]"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                        isSel ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))]" : "border-[hsl(var(--border))]"
                      )}>
                        {isSel && <Check size={11} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-[hsl(var(--text-primary))]">{b.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader><CardTitle>Review Summary</CardTitle></CardHeader>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[hsl(var(--text-muted))]">Title:</span> <span className="font-medium">{title}</span></div>
              <div><span className="text-[hsl(var(--text-muted))]">Duration:</span> <span className="font-medium">{durationMins} min</span></div>
              <div><span className="text-[hsl(var(--text-muted))]">Questions:</span> <span className="font-medium">{selected.length}</span></div>
              <div><span className="text-[hsl(var(--text-muted))]">Total marks:</span> <span className="font-medium">{selected.reduce((s, q) => s + q.marks, 0)}</span></div>
              <div><span className="text-[hsl(var(--text-muted))]">Negative marking:</span> <span className="font-medium">{negativeMarking ? `Yes (−${negativeValue}× per wrong)` : "No"}</span></div>
              <div><span className="text-[hsl(var(--text-muted))]">Batches:</span> <span className="font-medium">{selectedBatches.length} selected</span></div>
            </div>

            <div className="mt-5 border-t border-[hsl(var(--border))] pt-5 flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={publish}
                onClick={() => setPublish((v) => !v)}
                className={cn(
                  "w-11 h-6 rounded-full border-2 transition-colors relative shrink-0",
                  publish ? "bg-[hsl(var(--brand))] border-[hsl(var(--brand))]" : "bg-[hsl(var(--surface-2))] border-[hsl(var(--border))]"
                )}
              >
                <span className={cn(
                  "absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  publish ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--text-primary))]">Publish immediately</p>
                <p className="text-xs text-[hsl(var(--text-muted))]">Students can see and start the test right away</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {publish ? "Publish test" : "Save as draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
