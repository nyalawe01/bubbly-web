"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function StrengthenTopicButton({ notebookId, topic }: { notebookId: string, topic: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStrengthen = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebook_id: notebookId, topic }),
      });
      if (res.ok) {
        alert("Generating targeted remediation! Refresh the page in a few moments to see your new materials.");
        router.refresh();
      } else {
        alert("Failed to generate remediation.");
      }
    } catch (e) {
      alert("Error generating remediation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleStrengthen}
      disabled={loading}
      className="text-xs text-indigo-600 font-medium self-start hover:underline mt-1 flex items-center gap-1 disabled:opacity-50"
    >
      {loading ? <><Loader2 size={12} className="animate-spin" /> Generating...</> : "Strengthen This Topic →"}
    </button>
  );
}
