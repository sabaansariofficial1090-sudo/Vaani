import { Copy, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/lib/chat/copy";
import type { ChatMessage, Locale } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { VaaniMark } from "./logo";
import { ChatMarkdown, TypingDots } from "./markdown";

export function EmptyState({
  locale,
  onPick,
}: {
  locale: Locale;
  onPick: (text: string) => void;
}) {
  const t = copy[locale];
  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-8 sm:px-6">
      <div className="mx-auto my-auto w-full max-w-2xl">
        <h1 className="enter font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {t.emptyTitle}
        </h1>
        <p className="enter enter-delay-1 mt-3 max-w-md text-muted text-pretty">{t.emptyBody}</p>
        <div className="enter enter-delay-2 mt-6 grid gap-2 sm:grid-cols-2">
          {t.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-lg bg-surface px-4 py-3 text-left text-sm text-fg shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-[var(--motion-quick)] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({
  message,
  locale,
  isLastAssistant,
  streaming,
  onCopy,
  onRegen,
}: {
  message: ChatMessage;
  locale: Locale;
  isLastAssistant: boolean;
  streaming: boolean;
  onCopy: () => void;
  onRegen: () => void;
}) {
  const t = copy[locale];
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "group mx-auto w-full max-w-2xl px-4 sm:px-6",
        isUser ? "flex justify-end" : "",
      )}
    >
      {isUser ? (
        <div className="max-w-xl rounded-xl rounded-br-sm bg-surface-2 px-4 py-3 text-base leading-relaxed text-fg">
          <p className="whitespace-pre-wrap text-pretty">{message.content}</p>
        </div>
      ) : (
        <div className="flex w-full gap-3">
          <VaaniMark className="mt-1 size-7 shrink-0" />
          <div className="min-w-0 flex-1">
            {message.content ? (
              <ChatMarkdown text={message.content} />
            ) : (
              <TypingDots label={t.thinking} />
            )}
            {message.content && !streaming ? (
              <div className="mt-2 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-[var(--motion-quick)] sm:group-hover:opacity-100">
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Copy className="size-3.5" />
                  {t.copy}
                </button>
                {isLastAssistant ? (
                  <button
                    type="button"
                    onClick={onRegen}
                    className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2 text-xs text-muted hover:bg-surface-2 hover:text-fg"
                  >
                    <RefreshCw className="size-3.5" />
                    {t.regenerate}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}

export function Thread({
  locale,
  messages,
  streaming,
  banner,
  onPick,
  onRegen,
}: {
  locale: Locale;
  messages: ChatMessage[];
  streaming: boolean;
  banner: string | null;
  onPick: (text: string) => void;
  onRegen: () => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !stick.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  async function copyMsg(m: ChatMessage) {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      /* ignore */
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {banner ? (
          <p className="px-4 pt-4 text-center text-sm text-danger">{banner}</p>
        ) : null}
        <EmptyState locale={locale} onPick={onPick} />
      </div>
    );
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto py-6">
      <div className="flex flex-col gap-6">
        {banner ? (
          <p className="px-4 text-center text-sm text-danger">{banner}</p>
        ) : null}
        {messages.map((m) => (
          <Message
            key={m.id}
            message={m}
            locale={locale}
            isLastAssistant={m.id === lastAssistantId}
            streaming={streaming && m.id === lastAssistantId}
            onCopy={() => copyMsg(m)}
            onRegen={onRegen}
          />
        ))}
        {copiedId ? <span className="sr-only">{copy[locale].copied}</span> : null}
        <div className="h-2" />
      </div>
    </div>
  );
}
