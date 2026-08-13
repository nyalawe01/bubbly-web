"use client";
import { useState } from "react";
import { Sparkles, Send, Bug, MessageSquare, Code, Check } from "lucide-react";

export function AIProgrammerPanel({ code, output, onApplyFix }: { code: string, output: string, onApplyFix: (code: string) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const hasError = output.includes("Traceback") || output.includes("Error");

  const sendPrompt = (prompt: string) => {
    setMessages(prev => [...prev, { role: "user", content: prompt }]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      let reply = "";
      if (prompt.includes("explain") || prompt.includes("Explain")) {
        reply = "This code defines a function `reverse_list` that takes the head of a linked list. Currently, it just has a `pass` statement, meaning it does nothing. Finally, it prints a greeting.";
      } else if (prompt.includes("fix") || prompt.includes("Fix")) {
        reply = "I found the issue. The variable `error` is not defined. Here is the fixed code:\n```python\nprint('Fixed!')\n```";
      } else {
        reply = "I'm your AI Pair Programmer. I can help you write, explain, or debug this code. Select some code or tell me what you want to do.";
      }
      
      setMessages(prev => [...prev, { role: "ai", content: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-neutral-800 flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-400" />
        <h3 className="font-medium text-sm text-gray-200">AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasError && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">
            <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
              <Bug size={14} /> Error Detected
            </div>
            <p className="text-gray-300 text-xs mb-3">Your last run produced an error. I can analyze and fix it.</p>
            <button 
              onClick={() => sendPrompt("Fix the error in my code")}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded text-xs font-medium w-full"
            >
              Analyze & Fix
            </button>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`text-sm p-3 rounded-lg max-w-[90%] ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-gray-300'}`}>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.content.includes("```python") && (
                <button 
                  onClick={() => onApplyFix(code.replace("error", "print('Fixed!')"))}
                  className="mt-2 flex items-center gap-1 bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-xs text-white"
                >
                  <Check size={12} /> Apply Fix
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-xs text-gray-500 animate-pulse">AI is typing...</div>
        )}
      </div>

      <div className="p-3 border-t border-neutral-800">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => sendPrompt("Explain this code line by line")} className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-[11px] py-1.5 rounded flex items-center justify-center gap-1">
            <MessageSquare size={12} /> Explain
          </button>
          <button onClick={() => sendPrompt("Add comments to this code")} className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-[11px] py-1.5 rounded flex items-center justify-center gap-1">
            <Code size={12} /> Comments
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input && sendPrompt(input)}
            placeholder="Ask AI..."
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-3 pr-9 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={() => input && sendPrompt(input)}
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
