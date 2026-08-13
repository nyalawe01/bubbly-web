"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, WifiOff } from "lucide-react";
import { createClient } from "@/app/utils/supabase";
import { saveArtifactOffline, getArtifactOffline, queueOfflineAction } from "@/lib/offline/db";

export default function PracticeFlashcardsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Basic offline detection
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener('offline', () => setIsOffline(true));
      window.addEventListener('online', () => setIsOffline(false));
    }
    
    async function init() {
      let assetData = null;
      let notebook_id = null;

      try {
        const { data: res } = await supabase.from("notebook_assets").select("*").eq("id", id).single();
        assetData = res;
        if (assetData) saveArtifactOffline(assetData); // Cache for offline

        const { data: link } = await supabase.from("notebook_artifacts").select("notebook_id").eq("artifact_id", id).limit(1).single();
        notebook_id = link?.notebook_id;
      } catch (e) {
        // Fallback to offline DB
        assetData = await getArtifactOffline(id);
        setIsOffline(true);
      }
      if (!assetData || assetData.type !== "flashcards" || !assetData.content) {
        setLoading(false);
        return;
      }
      
      setAsset(assetData);
      
      // For a real app, we'd fetch overdue cards from the database if this was a combined SRS deck.
      // But here we are practicing a specific artifact. We just queue all its cards.
      const initialQueue = assetData.content.map((card: any, idx: number) => ({
        ...card,
        originalIndex: idx,
        rating: 0
      }));
      setQueue(initialQueue);

      // Create session
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes.user) {
          const { data: sess } = await supabase.from("flashcard_sessions").insert({
            user_id: userRes.user.id,
            flashcard_artifact_id: id,
            notebook_id,
          }).select().single();
          setSession(sess);
        }
      } catch (e) {
        // Offline: We'll have to use a mock session or queue it
        setSession({ id: `offline-${Date.now()}`, notebook_id });
      }
      
      setLoading(false);
    }
    init();
  }, [id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading flashcards...</div>;
  if (!asset) return <div className="p-8">Flashcards not found.</div>;
  
  const handleRate = async (rating: number) => {
    const currentCard = queue[currentIndex];
    const isMastered = rating >= 3;
    
    // Save review
    if (session) {
      const payload = {
        session_id: session.id,
        card: currentCard,
        rating,
        notebook_id: session.notebook_id
      };
      
      if (isOffline) {
        await queueOfflineAction("flashcard_review", payload);
      } else {
        try {
          await fetch("/api/flashcards/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          await queueOfflineAction("flashcard_review", payload);
        }
      }
    }

    if (!isMastered) {
      // Re-queue it at the end
      setQueue((prev) => [...prev, currentCard]);
    }

    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
    } else {
      setCompleted(true);
    }
  };

  const handleFinish = () => {
    if (session?.notebook_id) {
      router.push(`/notebooks/${session.notebook_id}`);
    } else {
      router.push("/vault");
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-500 mb-8">You've mastered all cards in this session.</p>
          <button onClick={handleFinish} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentCard = queue[currentIndex];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="h-14 bg-white border-b flex items-center px-6 shrink-0 gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-gray-800 flex-1 truncate">{asset.title}</h1>
        {isOffline && (
          <div className="flex items-center gap-1 text-amber-500 text-xs font-medium px-2 py-1 bg-amber-50 rounded-full">
            <WifiOff size={12} /> Offline Mode
          </div>
        )}
        <div className="text-sm text-gray-500 font-medium">Card {currentIndex + 1} of {queue.length}</div>
      </div>
      
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center">
        <div 
          className="perspective-1000 w-full max-w-2xl h-80 md:h-96 cursor-pointer"
          onClick={() => setFlipped(!flipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}>
            <div className="absolute w-full h-full backface-hidden bg-white border-2 border-gray-100 rounded-3xl shadow-sm flex items-center justify-center p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
                {currentCard.front}
              </h2>
            </div>
            <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-50 border-2 border-indigo-100 rounded-3xl shadow-sm flex items-center justify-center p-8 md:p-12 text-center">
              <p className="text-xl md:text-2xl text-indigo-950 font-medium leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 w-full max-w-2xl h-20 flex justify-center">
          {!flipped ? (
            <button 
              onClick={() => setFlipped(true)}
              className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium shadow-lg hover:bg-gray-800 transition-all hover:scale-105"
            >
              Reveal Answer
            </button>
          ) : (
            <div className="flex gap-4 w-full">
              <button onClick={() => handleRate(1)} className="flex-1 py-3 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200">Again (1)</button>
              <button onClick={() => handleRate(2)} className="flex-1 py-3 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200">Hard (2)</button>
              <button onClick={() => handleRate(3)} className="flex-1 py-3 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200">Good (3)</button>
              <button onClick={() => handleRate(4)} className="flex-1 py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200">Easy (4)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
