"use client";
import { useState, useEffect } from "react";
import { Sparkles, Send, Bug, MessageSquare, Code, Check, X, Info } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function AIProgrammerPanel({ code, output, onApplyFix }: { code: string, output: string, onApplyFix: (code: string) => void }) {
  const { colors } = useTheme();
  
  // Start with a mock welcome message that looks like it just built a foundation
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "I just built the foundation for you! I've set up a basic Python script. What else would you like to add?",
      diff: null
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const hasError = output.includes("Traceback") || output.includes("Error");

  const sendPrompt = async (prompt: string) => {
    const newMessages = [...messages, { role: "user", content: prompt }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    
    // Simulate thinking and generating a Diff Card
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "I've refactored the function to be more efficient.",
          diff: {
            old: `def reverse_list(head):\n    # Write your code here\n    pass`,
            new: `def reverse_list(head):\n    prev = None\n    current = head\n    while current:\n        next_node = current.next\n        current.next = prev\n        prev = current\n        current = next_node\n    return prev`
          },
          explain: "This implements an iterative reversal by keeping track of the previous node and flipping pointers."
        }
      ]);
    }, 1500);
  };

  return (
    <div className={`flex flex-col h-full ${colors.bgSidebar} ${colors.textPrimary}`}>
      <div className={`p-4 border-b flex items-center gap-2 ${colors.borderBase}`}>
        <Sparkles size={16} className="text-violet-500" />
        <h3 className="font-medium text-sm">Visual AI Feed</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasError && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-red-500 font-medium mb-1">
              <Bug size={14} /> Error Detected
            </div>
            <p className="text-red-400/80 text-xs mb-3">Your last run produced an error. I can analyze and fix it.</p>
            <button 
              onClick={() => sendPrompt("Fix the error in my code")}
              className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-medium w-full shadow-sm"
            >
              Analyze & Fix
            </button>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`text-sm p-3 rounded-lg max-w-[90%] shadow-sm ${m.role === 'user' ? 'bg-violet-600 text-white' : colors.bgCard + ' ' + colors.borderBase + ' border'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
            
            {/* Diff Card */}
            {m.diff && (
              <div className={`w-[95%] rounded-lg border overflow-hidden shadow-sm text-xs font-mono ${colors.bgInput} ${colors.borderBase}`}>
                <div className={`px-2 py-1 flex items-center justify-between border-b ${colors.borderBase} bg-red-500/10 text-red-500`}>
                  <span>- Removed</span>
                </div>
                <div className="p-2 overflow-x-auto text-red-400 opacity-80 whitespace-pre-wrap bg-red-500/5">{m.diff.old}</div>
                
                <div className={`px-2 py-1 flex items-center justify-between border-b border-t ${colors.borderBase} bg-emerald-500/10 text-emerald-500`}>
                  <span>+ Added</span>
                </div>
                <div className="p-2 overflow-x-auto text-emerald-400 whitespace-pre-wrap bg-emerald-500/5">{m.diff.new}</div>
                
                <div className={`p-2 flex gap-2 border-t ${colors.borderBase} ${colors.bgCard}`}>
                  <button 
                    onClick={() => onApplyFix(m.diff.new)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 py-1.5 rounded font-medium transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded font-medium transition-colors ${colors.bgHover} ${colors.textSecondary}`}>
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            )}
            
            {/* Explain Block */}
            {m.explain && (
              <details className={`w-[95%] rounded-lg border ${colors.borderBase} ${colors.bgCard}`}>
                <summary className={`px-3 py-2 text-xs font-medium cursor-pointer flex items-center gap-2 ${colors.textSecondary} hover:text-violet-500 transition-colors`}>
                  <Info size={14} /> Explain this change
                </summary>
                <div className={`px-3 py-2 text-xs border-t leading-relaxed ${colors.borderBase} ${colors.textSecondary}`}>
                  {m.explain}
                </div>
              </details>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-1 items-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>

      <div className={`p-3 border-t ${colors.borderBase}`}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => sendPrompt("Explain this code line by line")} className={`text-[11px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${colors.bgInput} ${colors.textSecondary} hover:text-violet-500`}>
            <MessageSquare size={12} /> Explain
          </button>
          <button onClick={() => sendPrompt("Refactor for performance")} className={`text-[11px] py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${colors.bgInput} ${colors.textSecondary} hover:text-violet-500`}>
            <Code size={12} /> Refactor
          </button>
        </div>
        <div className="relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input && sendPrompt(input)}
            placeholder="Ask AI to edit..."
            className={`w-full border rounded-lg pl-3 pr-9 py-2 text-sm focus:outline-none transition-colors ${colors.bgInput} ${colors.borderBase} ${colors.textPrimary} focus:border-violet-500`}
          />
          <button 
            onClick={() => input && sendPrompt(input)}
            className={`absolute right-2 top-2 transition-colors ${input ? 'text-violet-500' : colors.textSecondary}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
