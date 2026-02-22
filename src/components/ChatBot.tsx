import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send, Trash2, Bot, User, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  kn: "kn-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  bn: "bn-IN",
  ur: "ur-PK",
};

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastSpokenIndexRef = useRef<number>(-1);
  const { t, i18n } = useTranslation();

  const speechLang = LANG_MAP[i18n.language] || "en-US";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!ttsEnabled || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && !isLoading && messages.length - 1 !== lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = messages.length - 1;
      speak(lastMsg.content);
    }
  }, [messages, isLoading, ttsEnabled]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [speechLang]);

  const toggleTts = () => {
    if (ttsEnabled) window.speechSynthesis?.cancel();
    setTtsEnabled(!ttsEnabled);
  };

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
      if (event.results[0]?.isFinal) {
        const final = transcript.trim();
        if (final) {
          setInput("");
          sendMessage(final);
        }
        setIsListening(false);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [speechLang, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasSpeechRecognition = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 md:bottom-6",
          "bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl",
          isOpen && "rotate-90 scale-90"
        )}
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-[60] flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:bottom-20 md:h-[32rem] md:w-96">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary-foreground" />
              <div>
                <p className="text-sm font-semibold text-primary-foreground">AgriSense AI</p>
                <p className="text-[10px] text-primary-foreground/70">Voice & text — ask anything</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTts} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20" title={ttsEnabled ? "Mute voice" : "Unmute voice"}>
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Bot className="h-10 w-10 text-primary/40" />
                <p className="text-sm font-medium">Welcome to AgriSense AI!</p>
                <p className="text-xs">Type or tap 🎤 to ask about crops, soil, weather, pests, or any farming topic.</p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {["Best crops for summer?", "How to improve soil?", "Pest control tips"].map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-[11px] text-foreground transition-colors hover:bg-accent"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2">
              {hasSpeechRecognition && (
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isLoading}
                  size="icon"
                  variant={isListening ? "destructive" : "outline"}
                  className={cn("h-9 w-9 shrink-0 rounded-full", isListening && "animate-pulse")}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type your question..."}
                className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
