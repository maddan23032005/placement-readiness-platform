"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

interface Props {
  testId: string;
  currentStatus: string;
}

export function TestStatusControl({ testId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(status: string) {
    setLoading(true);
    const res = await fetch(`/api/tests/${testId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(`Test ${status === "PUBLISHED" ? "published" : status === "ARCHIVED" ? "archived" : "set to draft"}.`);
      router.refresh();
    } else {
      toast.error("Failed to update status.");
    }
  }

  return (
    <div className="flex gap-2">
      {currentStatus !== "PUBLISHED" && (
        <Button variant="primary" size="sm" loading={loading} onClick={() => setStatus("PUBLISHED")}>
          Publish
        </Button>
      )}
      {currentStatus === "PUBLISHED" && (
        <Button variant="outline" size="sm" loading={loading} onClick={() => setStatus("DRAFT")}>
          Unpublish
        </Button>
      )}
      {currentStatus !== "ARCHIVED" && (
        <Button variant="ghost" size="sm" loading={loading} onClick={() => setStatus("ARCHIVED")}>
          Archive
        </Button>
      )}
    </div>
  );
}
