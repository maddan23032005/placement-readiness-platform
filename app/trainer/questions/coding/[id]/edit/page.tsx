"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import { Editor } from "@monaco-editor/react";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

const TOPICS = ["DSA", "DBMS", "OS", "Networks", "OOP", "Aptitude", "Verbal", "SQL", "System Design", "Other"];

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export default function EditCodingQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [starterCode, setStarterCode] = useState("");
  const [solutionCode, setSolutionCode] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(`/api/questions/coding/${id}`);
        if (!res.ok) {
          toast.error("Failed to load question");
          router.push("/trainer/questions");
          return;
        }
        const data = await res.json();
        const q = data.question;
        setTitle(q.title);
        setDescription(q.description);
        setLanguage(q.language);
        setStarterCode(q.starterCode);
        setSolutionCode(q.solutionCode || "");
        setTopic(q.topic);
        setDifficulty(q.difficulty);
        setTestCases(q.testCases);
        setLoading(false);
      } catch (error) {
        toast.error("Error loading question");
        router.push("/trainer/questions");
      }
    }
    fetchQuestion();
  }, [id, router]);

  async function handleSave() {
    if (!title.trim() || !description.trim() || !topic || testCases.length === 0) {
      toast.error("Please fill all required fields and add at least one test case.");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/questions/coding/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        language,
        starterCode,
        solutionCode,
        testCases,
        topic,
        difficulty,
      }),
    });
    setSaving(false);

    if (res.ok) {
      toast.success("Coding question updated successfully.");
      router.push("/trainer/questions");
    } else {
      const data = await res.json();
      if (data.details && data.details.fieldErrors) {
        const firstErr = Object.values(data.details.fieldErrors)[0] as string[];
        toast.error(firstErr[0] || data.error || "Validation failed");
      } else {
        toast.error(data.error || "Failed to update question");
      }
    }
  }

  function addTestCase() {
    setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
  }

  function updateTestCase(index: number, field: keyof TestCase, value: string | boolean) {
    const newCases = [...testCases];
    newCases[index] = { ...newCases[index], [field]: value };
    setTestCases(newCases);
  }

  function removeTestCase(index: number) {
    setTestCases(testCases.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-[hsl(var(--text-muted))]">Loading question details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Coding Question</h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">Update your programming challenge</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Details</CardTitle></CardHeader>
          <div className="p-6 space-y-4 pt-0">
            <Input id="q-title" label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Two Sum" />
            <Textarea id="q-desc" label="Problem Description *" value={description} onChange={setDescription} rows={5} placeholder="Describe the problem, input format, and constraints..." />
            
            <div className="grid grid-cols-2 gap-4">
              <Select id="q-topic" label="Topic *" value={topic} onChange={setTopic} options={TOPICS.map((t) => ({ label: t, value: t }))} placeholder="Select topic" />
              <Select id="q-diff" label="Difficulty *" value={difficulty} onChange={setDifficulty} options={[{ label: "Easy", value: "EASY" }, { label: "Medium", value: "MEDIUM" }, { label: "Hard", value: "HARD" }]} />
              <Select id="q-lang" label="Language *" value={language} onChange={setLanguage} options={[
                { label: "JavaScript (Node.js)", value: "javascript" },
                { label: "Python 3", value: "python" },
                { label: "Java", value: "java" },
                { label: "C++", value: "c++" },
              ]} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Code Setup</CardTitle></CardHeader>
          <div className="p-6 space-y-6 pt-0">
            <div>
              <label className="label mb-2 block">Starter Code *</label>
              <div className="h-64 rounded-md overflow-hidden border border-[hsl(var(--border))]">
                <Editor
                  height="100%"
                  language={language === "c++" ? "cpp" : language}
                  value={starterCode}
                  onChange={(val) => setStarterCode(val || "")}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                  theme="vs-dark"
                />
              </div>
            </div>
            <div>
              <label className="label mb-2 block">Solution Code (Optional)</label>
              <div className="h-64 rounded-md overflow-hidden border border-[hsl(var(--border))]">
                <Editor
                  height="100%"
                  language={language === "c++" ? "cpp" : language}
                  value={solutionCode}
                  onChange={(val) => setSolutionCode(val || "")}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                  theme="vs-dark"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center w-full">
              <CardTitle>Test Cases</CardTitle>
              <Button variant="outline" size="sm" onClick={addTestCase}>
                <Plus size={14} /> Add Test Case
              </Button>
            </div>
          </CardHeader>
          <div className="p-6 space-y-6 pt-0">
            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 border border-[hsl(var(--border))] rounded-lg relative">
                <div className="absolute right-4 top-4 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))]">
                    <input type="checkbox" checked={tc.isHidden} onChange={(e) => updateTestCase(idx, "isHidden", e.target.checked)} className="rounded" />
                    Hidden Test Case
                  </label>
                  {testCases.length > 1 && (
                    <button onClick={() => removeTestCase(idx)} className="text-[hsl(var(--error))] hover:opacity-80">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h4 className="font-medium mb-4">Test Case {idx + 1}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Textarea label="Standard Input (stdin)" value={tc.input} onChange={(val) => updateTestCase(idx, "input", val)} rows={3} placeholder="e.g. 2 3\n5" />
                  <Textarea label="Expected Output (stdout)" value={tc.expectedOutput} onChange={(val) => updateTestCase(idx, "expectedOutput", val)} rows={3} placeholder="e.g. 7" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
