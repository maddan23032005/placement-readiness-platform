"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";
import { Plus, Users, UserPlus } from "lucide-react";


interface Batch {
  id: string;
  name: string;
  _count: { members: number };
}

interface Member {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
  branch: string | null;
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchName, setBatchName] = useState("");
  const [creating, setCreating] = useState(false);

  const [enrollModal, setEnrollModal] = useState<{ batchId: string; batchName: string } | null>(null);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  async function fetchBatches() {
    const res = await fetch("/api/batches");
    const data = await res.json();
    setBatches(data.batches || []);
    setLoading(false);
  }

  useEffect(() => { fetchBatches(); }, []);

  async function fetchMembers(batchId: string) {
    setMembersLoading(true);
    const res = await fetch(`/api/batches/${batchId}/members`);
    const data = await res.json();
    setMembers(data.members || []);
    setMembersLoading(false);
  }

  async function createBatch() {
    if (!batchName.trim()) { toast.error("Batch name is required."); return; }
    setCreating(true);
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: batchName }),
    });
    setCreating(false);
    if (res.ok) {
      toast.success("Batch created.");
      setBatchName("");
      fetchBatches();
    } else {
      toast.error("Failed to create batch.");
    }
  }

  async function enrollStudent() {
    if (!enrollEmail.trim() || !enrollModal) return;
    setEnrolling(true);
    const res = await fetch(`/api/batches/${enrollModal.batchId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: enrollEmail }),
    });
    const data = await res.json();
    setEnrolling(false);
    if (res.ok) {
      toast.success("Student enrolled.");
      setEnrollEmail("");
      fetchMembers(enrollModal.batchId);
      fetchBatches();
    } else {
      toast.error(data.error || "Failed to enroll student.");
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">Manage student groups and enrollment</p>
        </div>
      </div>

      {/* Create batch */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Create New Batch</CardTitle></CardHeader>
        <div className="flex gap-3">
          <Input
            id="batch-name"
            placeholder="e.g. CSE 2025 Section A"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={createBatch} loading={creating}>
            <Plus size={15} /> Create
          </Button>
        </div>
      </Card>

      {/* Batch list */}
      {loading ? (
        <p className="text-sm text-[hsl(var(--text-muted))] text-center py-8">Loading batches...</p>
      ) : batches.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={36} />}
            title="No batches yet"
            description="Create your first batch above to start enrolling students."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div key={b.id} className="card p-5 flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--surface-2))] flex items-center justify-center shrink-0">
                <Users size={18} className="text-[hsl(var(--text-secondary))]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[hsl(var(--text-primary))]">{b.name}</p>
                <p className="text-xs text-[hsl(var(--text-muted))]">
                  {b._count.members} student{b._count.members !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEnrollModal({ batchId: b.id, batchName: b.name });
                  setEnrollEmail("");
                  fetchMembers(b.id);
                }}
              >
                <UserPlus size={14} /> Manage students
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Enroll modal */}
      <Modal
        open={!!enrollModal}
        onClose={() => setEnrollModal(null)}
        title={`Manage — ${enrollModal?.batchName}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              id="enroll-email"
              placeholder="student@example.com"
              type="email"
              value={enrollEmail}
              onChange={(e) => setEnrollEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={enrollStudent} loading={enrolling} size="md">
              <UserPlus size={14} /> Enroll
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold text-[hsl(var(--text-muted))] uppercase tracking-wide mb-3">
              Enrolled Students
            </p>
            {membersLoading ? (
              <p className="text-sm text-[hsl(var(--text-muted))] py-4 text-center">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-[hsl(var(--text-muted))] py-4 text-center">No students enrolled yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 bg-[hsl(var(--surface-2))] rounded-lg">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--brand-light))] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[hsl(var(--brand))]">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[hsl(var(--text-primary))] truncate">{m.name}</p>
                      <p className="text-xs text-[hsl(var(--text-muted))]">
                        {m.email}{m.rollNumber ? ` · ${m.rollNumber}` : ""}{m.branch ? ` · ${m.branch}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
