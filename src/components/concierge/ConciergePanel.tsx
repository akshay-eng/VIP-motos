import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ChevronRight, KeyRound, Mic, RotateCcw, Sparkles, X } from "lucide-react";
import { initialState, respond, respondAbout, respondToRemoval, WELCOME, type EngineState } from "@/ai/engine";
import { ConciergeUnavailable, getApiKey, setApiKey } from "@/ai/key";
import type { ChatMessage, ConciergeReply } from "@/ai/types";
import { byId } from "@/data/inventory";
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { dur, ease } from "@/lib/motion";
import { useApp } from "@/state/app-state";
import { MatchesPane } from "./MatchesPane";
import { ActionButtons, CompareTable, EmiTable, RecCard, UnderstoodChips } from "./ReplyBlocks";

export const ASSISTANT = "Co-Driver";

let seq = 0;
const uid = () => `m${++seq}`;

const welcomeMessage = (): ChatMessage => ({ id: uid(), role: "assistant", text: WELCOME.text, reply: WELCOME });

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

function speechRecognition(): SpeechCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const hasVisuals = (r?: ConciergeReply) => !!r && (r.cars.length > 0 || !!r.compare || !!r.emi);

/**
 * The Co-Driver: a large modal. On wide screens the conversation runs down
 * the left and the cars it finds fill the right; on phones it's one column.
 */
export function ConciergePanel() {
  const { conciergeOpen, closeConcierge, pendingPrompt, takePendingPrompt } = useApp();
  const wide = useMediaQuery("(min-width: 1024px)");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage()]);
  const [engine, setEngine] = useState<EngineState>(initialState);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!getApiKey());
  const [pinned, setPinned] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const onNavigate = useCallback(() => closeConcierge(), [closeConcierge]);

  const pushReply = useCallback((reply: ConciergeReply) => {
    setMessages((m) => [...m, { id: uid(), role: "assistant", text: reply.text, reply }]);
    setPinned(null);
  }, []);

  const send = useCallback(
    async (text: string, carId?: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;
      const userMsg: ChatMessage = { id: uid(), role: "user", text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setThinking(true);

      // The local engine always runs: it is the answer without a key, and
      // keeps preference state in step when Claude answers.
      const local = carId ? respondAbout(carId, engineRef.current) : respond(trimmed, engineRef.current);
      setEngine(local.state);

      const key = getApiKey();
      if (key) {
        try {
          const { askClaude } = await import("@/ai/claude");
          pushReply(await askClaude([...messagesRef.current, userMsg], key));
        } catch (err) {
          const why = err instanceof ConciergeUnavailable ? err.message : "Something went wrong.";
          pushReply({ ...local.reply, note: `${why} Answered on-device instead.` });
        }
      } else {
        await new Promise((r) => setTimeout(r, 480));
        pushReply(local.reply);
      }
      setThinking(false);
    },
    [thinking, pushReply],
  );

  // A prompt handed over from elsewhere on the site ("Ask about this car").
  useEffect(() => {
    if (conciergeOpen && pendingPrompt) {
      const p = takePendingPrompt();
      if (p) void send(p.text, p.carId);
    }
  }, [conciergeOpen, pendingPrompt, takePendingPrompt, send]);

  // New replies scroll to their first line; the visitor's own messages and
  // the typing dots scroll to the end.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && messages.length > 1 && !thinking) {
      const node = el.querySelector<HTMLElement>(`[data-msg="${last.id}"]`);
      if (node) {
        el.scrollTo({ top: node.offsetTop - 16, behavior: "smooth" });
        return;
      }
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function removeChip(key: string) {
    const r = respondToRemoval(key, engineRef.current);
    setEngine(r.state);
    pushReply(r.reply);
  }

  function reset() {
    setEngine(initialState());
    setMessages([welcomeMessage()]);
    setPinned(null);
  }

  function listen() {
    const Ctor = speechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = e.results[0]?.[0]?.transcript ?? "";
      if (said) void send(said);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  function saveKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get("key") ?? "").trim();
    setApiKey(v || null);
    setHasKey(!!getApiKey());
    setShowKey(false);
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const showcase = (pinned ? messages.find((m) => m.id === pinned) : [...messages].reverse().find((m) => m.role === "assistant" && hasVisuals(m.reply)))?.reply;
  const canListen = typeof window !== "undefined" && !!speechRecognition();

  return (
    <Dialog.Root open={conciergeOpen} onOpenChange={(o) => !o && closeConcierge()}>
      <AnimatePresence>
        {conciergeOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                if (wide) field.current?.focus();
              }}
            >
              <motion.div
                className="fixed inset-0 z-[55] grid overflow-hidden bg-bg text-fg sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(920px,92dvh)] sm:w-[min(1400px,96vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px] sm:border sm:border-line-strong sm:shadow-2xl sm:shadow-black/50 lg:grid-cols-[minmax(380px,460px)_1fr]"
                initial={{ opacity: 0, scale: 0.92, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 28 } }}
                exit={{ opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.2, ease: ease.exit } }}
              >
                <section className="flex min-h-0 flex-col border-line lg:border-r">
                  <header className="flex items-center gap-3 border-b border-line px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
                    <span className="relative grid size-11 place-items-center rounded-full bg-accent text-on-accent">
                      <span className="pulse-ring absolute inset-0 rounded-full bg-accent" aria-hidden />
                      <Sparkles className="relative size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Dialog.Title className="display text-lg">VIP {ASSISTANT}</Dialog.Title>
                      <Dialog.Description className="truncate text-xs text-muted">{hasKey ? "Powered by Claude · knows today's stock" : "Your AI guide to today's stock"}</Dialog.Description>
                    </div>
                    <button type="button" onClick={() => setShowKey((s) => !s)} aria-label={`${ASSISTANT} settings`} aria-expanded={showKey} className={cn("grid size-9 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-fg/5 hover:text-fg", showKey && "bg-fg/5 text-fg")}>
                      <KeyRound className="size-4" />
                    </button>
                    <button type="button" onClick={reset} aria-label="Start a new conversation" className="grid size-9 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-fg/5 hover:text-fg">
                      <RotateCcw className="size-4" />
                    </button>
                    <Dialog.Close aria-label={`Close ${ASSISTANT}`} className="grid size-9 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-fg/5 hover:text-fg">
                      <X className="size-[18px]" />
                    </Dialog.Close>
                  </header>

                  <AnimatePresence initial={false}>
                    {showKey && (
                      <motion.form
                        onSubmit={saveKey}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: ease.enter } }}
                        exit={{ opacity: 0, y: -6, transition: { duration: 0.2, ease: ease.exit } }}
                        className="grid gap-2 border-b border-line bg-fg/[0.02] px-5 py-4"
                      >
                        <label htmlFor="api-key" className="text-xs text-muted">
                          Optional: paste an Anthropic API key to answer with Claude. Without one, matching runs entirely in your browser. The key stays in this browser; use a server proxy before going live.
                        </label>
                        <div className="flex gap-2">
                          <input id="api-key" name="key" type="password" defaultValue={getApiKey() ?? ""} placeholder="sk-ant-..." className="field h-10" autoComplete="off" />
                          <button type="submit" className="btn-inverse h-10 px-4">
                            {hasKey ? "Update" : "Use Claude"}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5" aria-live="polite">
                    <ol className="grid gap-5">
                      {messages.map((m) => (
                        <motion.li
                          key={m.id}
                          data-msg={m.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: ease.enter } }}
                          className={cn("grid gap-3", m.role === "user" && "justify-items-end")}
                        >
                          {m.role === "user" ? (
                            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-fg px-4 py-2.5 text-[14px] leading-relaxed text-bg">{m.text}</p>
                          ) : (
                            <AssistantMessage
                              message={m}
                              isLast={m === lastAssistant}
                              wide={wide}
                              showing={showcase === m.reply}
                              onShow={() => setPinned(m.id)}
                              onChip={(t) => void send(t)}
                              onRemove={removeChip}
                              onNavigate={onNavigate}
                            />
                          )}
                        </motion.li>
                      ))}
                      {thinking && (
                        <li className="flex items-center gap-1.5 px-1 py-2" aria-label={`${ASSISTANT} is typing`}>
                          {[0, 1, 2].map((i) => (
                            <span key={i} className="typing-dot size-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </li>
                      )}
                    </ol>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send(input);
                    }}
                    className="border-t border-line p-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:p-4"
                  >
                    <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-surface p-1.5 transition-colors duration-150 focus-within:border-accent/70">
                      <label htmlFor="concierge-input" className="sr-only">
                        Describe the car you want
                      </label>
                      <textarea
                        id="concierge-input"
                        ref={field}
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void send(input);
                          }
                        }}
                        placeholder="Describe the car you want…"
                        className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-fg placeholder:text-subtle focus:outline-none [field-sizing:content]"
                      />
                      {canListen && (
                        <button type="button" onClick={listen} aria-label={listening ? "Listening" : "Speak your request"} className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-muted transition-colors duration-150 hover:bg-fg/5 hover:text-fg", listening && "text-accent-fg")}>
                          <Mic className="size-[18px]" />
                        </button>
                      )}
                      <button type="submit" aria-label="Send" disabled={!input.trim() || thinking} className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-on-accent transition-colors duration-150 hover:bg-accent-strong disabled:bg-fg/10 disabled:text-subtle">
                        <ArrowUp className="size-[18px]" />
                      </button>
                    </div>
                  </form>
                </section>

                {wide && (
                  <section className="hidden min-h-0 bg-surface lg:block" aria-label="Matches">
                    <MatchesPane reply={showcase} onSend={(t) => void send(t)} onRemove={removeChip} onNavigate={onNavigate} />
                  </section>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function AssistantMessage({
  message,
  isLast,
  wide,
  showing,
  onShow,
  onChip,
  onRemove,
  onNavigate,
}: {
  message: ChatMessage;
  isLast: boolean;
  wide: boolean;
  showing: boolean;
  onShow: () => void;
  onChip: (t: string) => void;
  onRemove: (k: string) => void;
  onNavigate: () => void;
}) {
  const r = message.reply!;
  return (
    <>
      <div className="flex gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-fg" aria-hidden>
          <Sparkles className="size-3.5" />
        </span>
        <div className="grid min-w-0 flex-1 gap-3">
          <p className="text-[14px] leading-relaxed text-fg/95">{message.text}</p>
          {r.note && <p className="rounded-xl bg-warn/10 px-3 py-2 text-xs text-warn">{r.note}</p>}
          {isLast && !wide && <UnderstoodChips reply={r} onRemove={r.source === "local" ? onRemove : undefined} />}
        </div>
      </div>
      {wide ? (
        hasVisuals(r) && (
          <button type="button" onClick={onShow} className={cn("ml-9 flex items-center gap-3 rounded-2xl border p-2 pr-3 text-left transition-colors duration-150", showing ? "border-accent/50 bg-accent/[0.06]" : "border-line hover:border-line-strong")}>
            <span className="flex -space-x-3">
              {(r.compare ?? r.cars.map((c) => c.id)).slice(0, 3).map((id) => {
                const c = byId.get(id);
                return c ? <img key={id} src={c.images[0]?.src.replace(/\.jpg$/, "-sm.jpg")} alt="" className="size-10 rounded-full border-2 border-bg object-cover" /> : null;
              })}
            </span>
            <span className="flex-1 text-xs text-muted">{showing ? "Showing on the right" : r.compare ? "Show the comparison" : r.emi ? "Show the EMI table" : `Show ${r.cars.length} match${r.cars.length === 1 ? "" : "es"}`}</span>
            <ChevronRight className="size-4 text-subtle" aria-hidden />
          </button>
        )
      ) : (
        <>
          {r.cars.length > 0 && (
            <ul className="grid gap-2.5">
              {r.cars.map((c, i) => (
                <RecCard key={c.id} rec={c} index={i} onNavigate={onNavigate} />
              ))}
            </ul>
          )}
          {r.compare && <CompareTable ids={r.compare} />}
          {r.emi && <EmiTable emi={r.emi} />}
          <ActionButtons actions={r.actions} onNavigate={onNavigate} />
        </>
      )}
      {wide && !hasVisuals(r) && <ActionButtons actions={r.actions} onNavigate={onNavigate} />}
      {isLast && r.chips.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-9">
          {r.chips.map((c) => (
            <button key={c} type="button" onClick={() => onChip(c)} className="chip h-8 text-xs">
              {c}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function ConciergeLauncher() {
  const { conciergeOpen, openConcierge } = useApp();
  const { pathname } = useLocation();
  // On the home hero the header already offers the Co-Driver; the floating
  // button appears once the hero scrolls away.
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const on = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const show = !conciergeOpen && (pathname !== "/" || pastHero);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={() => openConcierge()}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: dur.standard, ease: ease.enter } }}
          exit={{ opacity: 0, y: 12, scale: 0.9, transition: { duration: 0.2, ease: ease.exit } }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-3 rounded-full bg-fg pl-2 pr-6 text-sm font-semibold text-bg shadow-2xl shadow-black/40 md:flex"
        >
          <span className="relative grid size-10 place-items-center rounded-full bg-accent text-on-accent">
            <span className="pulse-ring absolute inset-0 rounded-full bg-accent" aria-hidden />
            <Sparkles className="relative size-4" aria-hidden />
          </span>
          Ask the {ASSISTANT}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
