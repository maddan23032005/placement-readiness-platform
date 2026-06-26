"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { Plus, Trash2, Pencil, Search, BookOpen, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  options: string[];
  correctOptions: number[];
  tags: string[];
}

const TOPICS = ["DSA", "DBMS", "OS", "Networks", "OOP", "Aptitude", "Verbal", "SQL", "System Design", "Other"];

function QuestionForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<Question>;
  onSave: (data: Omit<Question, "id">) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const [text, setText] = useState(initial?.text || "");
  const [options, setOptions] = useState<string[]>(initial?.options || ["", "", "", ""]);
  const [correct, setCorrect] = useState<number[]>(initial?.correctOptions || []);
  const [topic, setTopic] = useState(initial?.topic || "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "MEDIUM");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!text.trim()) e.text = "Question text is required";
    if (options.filter((o) => o.trim()).length < 2) e.options = "At least 2 options required";
    if (correct.length === 0) e.correct = "Select at least one correct answer";
    if (!topic) e.topic = "Topic is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toggleOption(opt: string, i: number) {
    const o = [...options];
    o[i] = opt;
    setOptions(o);
  }

  function toggleCorrect(i: number) {
    setCorrect((prev) => prev.includes(i) ? prev.filter((c) => c !== i) : [...prev, i]);
  }

  async function handleSave() {
    if (!validate()) return;
    await onSave({
      text: text.trim(),
      options: options.filter((o) => o.trim()),
      correctOptions: correct,
      topic,
      difficulty,
      tags: [],
    });
  }

  return (
    <div className="space-y-4">
      <Textarea id="q-text" label="Question text *" placeholder="Enter your question here..." value={text} onChange={setText} rows={3} error={errors.text} />

      <div>
        <p className="label">Options * <span className="text-[hsl(var(--text-muted))] text-xs font-normal">(click the circle to mark correct answer)</span></p>
        {errors.options && <p className="hint-error mb-2">{errors.options}</p>}
        {errors.correct && <p className="hint-error mb-2">{errors.correct}</p>}
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCorrect(i)}
                aria-label={`Mark option ${String.fromCharCode(65 + i)} as correct`}
                aria-pressed={correct.includes(i)}
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  correct.includes(i)
                    ? "bg-[hsl(var(--success))] border-[hsl(var(--success))]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--success)/0.6)]"
                )}
              >
                {correct.includes(i) && <Check size={13} className="text-white" />}
              </button>
              <span className="text-xs font-semibold text-[hsl(var(--text-muted))] w-5">{String.fromCharCode(65 + i)}.</span>
              <input
                className="field flex-1"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={(e) => toggleOption(e.target.value, i)}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => { setOptions((o) => o.filter((_, j) => j !== i)); setCorrect((c) => c.filter((x) => x !== i).map((x) => x > i ? x - 1 : x)); }}
                  className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--error))] transition-colors"
                  aria-label="Remove option"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={() => setOptions((o) => [...o, ""])}
              className="text-xs text-[hsl(var(--brand))] hover:underline flex items-center gap-1 ml-9 mt-1"
            >
              <Plus size={12} /> Add option
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="q-topic"
          label="Topic *"
          value={topic}
          onChange={setTopic}
          options={TOPICS.map((t) => ({ label: t, value: t }))}
          placeholder="Select topic"
          error={errors.topic}
        />
        <Select
          id="q-diff"
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { label: "Easy", value: "EASY" },
            { label: "Medium", value: "MEDIUM" },
            { label: "Hard", value: "HARD" },
          ]}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} loading={loading}>Save question</Button>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("");
  const [diff, setDiff] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchQuestions() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (topic) params.set("topic", topic);
    if (diff) params.set("difficulty", diff);
    const res = await fetch(`/api/questions/mcq?${params}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }

  useEffect(() => { fetchQuestions(); }, [search, topic, diff]);

  async function handleSave(data: Omit<Question, "id">) {
    setSaving(true);
    const url = editingQ ? `/api/questions/mcq/${editingQ.id}` : "/api/questions/mcq";
    const method = editingQ ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(editingQ ? "Question updated." : "Question added.");
      setModalOpen(false);
      setEditingQ(null);
      fetchQuestions();
    } else {
      toast.error("Failed to save question.");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/questions/mcq/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Question deleted.");
      setQuestions((q) => q.filter((x) => x.id !== id));
    } else {
      toast.error("Failed to delete question.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p className="page-subtitle">{questions.length} question{questions.length !== 1 ? "s" : ""} in your bank</p>
        </div>
        <Button onClick={() => { setEditingQ(null); setModalOpen(true); }}>
          <Plus size={15} /> Add question
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
          <input className="field pl-9" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="field w-40" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="field w-36" value={diff} onChange={(e) => setDiff(e.target.value)}>
          <option value="">All levels</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="py-16 text-center text-sm text-[hsl(var(--text-muted))]">Loading questions...</div>
        ) : questions.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={36} />}
            title="No questions found"
            description="Add questions to your bank to use them in tests."
            action={
              <Button onClick={() => { setEditingQ(null); setModalOpen(true); }}>
                <Plus size={14} /> Add question
              </Button>
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Question</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Options</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td className="text-[hsl(var(--text-muted))]">{i + 1}</td>
                  <td className="max-w-xs">
                    <p className="text-sm text-[hsl(var(--text-primary))] line-clamp-2">{q.text}</p>
                  </td>
                  <td><span className="badge-neutral">{q.topic}</span></td>
                  <td>
                    <span className={cn("badge",
                      q.difficulty === "EASY" ? "badge-success" :
                      q.difficulty === "MEDIUM" ? "badge-warning" : "badge-error"
                    )}>{q.difficulty}</span>
                  </td>
                  <td className="text-sm text-[hsl(var(--text-muted))]">
                    {(q.options as string[]).length} options
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditingQ(q); setModalOpen(true); }}
                        className="p-1.5 rounded-md text-[hsl(var(--text-muted))] hover:text-[hsl(var(--brand))] hover:bg-[hsl(var(--brand-light))] transition-colors"
                        aria-label="Edit question"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 rounded-md text-[hsl(var(--text-muted))] hover:text-[hsl(var(--error))] hover:bg-[hsl(var(--error)/0.08)] transition-colors"
                        aria-label="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingQ(null); }}
        title={editingQ ? "Edit Question" : "Add Question"}
        size="lg"
      >
        <QuestionForm
          initial={editingQ || undefined}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditingQ(null); }}
          loading={saving}
        />
      </Modal>
    </>
  );
}
