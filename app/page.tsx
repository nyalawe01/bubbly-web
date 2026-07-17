"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/app/utils/supabase";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Reveal } from "@/components/ui/motion";

export default function AuthScreen() {
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Ask for Google Drive access as part of sign-up/sign-in, so the consent
        // screen includes Drive up front. access_type=offline + prompt=consent so a
        // refresh token is issued and the Drive permission is always shown.
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email profile https://www.googleapis.com/auth/drive.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/chat");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        router.push("/chat");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] flex flex-col items-center justify-center p-4 ${colors.bgApp} relative overflow-hidden`}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[var(--accent)]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Static wordmark — no floating animation. */}
      <div className="mb-10 z-10">
        <span className={`text-4xl md:text-5xl font-semibold tracking-tight ${colors.textPrimary}`}>bubbly</span>
      </div>

      <Reveal className="w-full max-w-[400px] z-10">
        <div className={`space-y-6 ${colors.bgCard} border ${colors.borderBase} rounded-[28px] shadow-2xl p-6 md:p-8`}>
          <div className="space-y-1.5 text-center">
            <h1 className={`text-xl font-semibold tracking-tight ${colors.textPrimary}`}>
              {isLogin ? "Sign in to your workspace" : "Create your workspace"}
            </h1>
            <p className={`${colors.textSecondary} text-sm`}>
              Your notes, your chat, your study tools — all in one place.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-xl px-3.5 py-2.5 text-xs text-red-400">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className={`icon-motion w-full flex items-center justify-center gap-2.5 ${colors.bgInput} ${colors.bgHover} ${colors.textPrimary} border ${colors.borderBase} py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:pointer-events-none`}
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className={`h-px flex-1 ${colors.borderBase}`} />
            <span className={`${colors.textSecondary} text-xs tracking-wider uppercase`}>or</span>
            <div className={`h-px flex-1 ${colors.borderBase}`} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {!isLogin && (
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${colors.textSecondary}`} size={16} />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full ${colors.bgInput} border ${colors.borderBase} rounded-xl py-2.5 pl-10 pr-3.5 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all ${colors.textPrimary}`}
                />
              </div>
            )}

            <div className="relative">
              <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${colors.textSecondary}`} size={16} />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full ${colors.bgInput} border ${colors.borderBase} rounded-xl py-2.5 pl-10 pr-3.5 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all ${colors.textPrimary}`}
              />
            </div>

            <div className="relative">
              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${colors.textSecondary}`} size={16} />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full ${colors.bgInput} border ${colors.borderBase} rounded-xl py-2.5 pl-10 pr-3.5 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] text-sm transition-all ${colors.textPrimary}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`icon-motion w-full flex items-center justify-center gap-2 ${colors.btnPrimary} py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 disabled:pointer-events-none mt-4`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In with Email" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className={`${colors.textSecondary} hover:opacity-80 text-xs transition-opacity`}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
