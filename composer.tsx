import { Brain, SendHorizontal, Square } from "lucide-react";
import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { copy } from "@/lib/chat/copy";
import { MODES, type Mode } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_LEN = 4000;

export function Composer({
  locale,
  mode,
  think,
  streaming,
  disabled,
  onMode,
  onThink,
  onSend,
  onStop,
}: {
  locale: "en" | "hi";
  mode: Mode;
  think: boolean;
  streaming: boolean;
  disabled?: boolean;
  onMode: (mode: Mode) => void;
  onThink: (think: boolean) => void;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const t = copy[locale];
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }

  useEffect(() => {
    resize();
  }, []);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (streaming) return;
    const value = ref.current?.value.trim() ?? "";
    if (!value || disabled) return;
    onSend(value.slice(0, MAX_LEN));
    if (ref.current) {
      ref.current.value = "";
      resize();
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-2xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMode(m)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]",
              mode === m
                ? "bg-accent text-accent-fg"
                : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {t.modes[m]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onThink(!think)}
          className={cn(
            "ml-auto inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,color] duration-[var(--motion-quick)]",
            think ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
          )}
          aria-pressed={think}
        >
          <Brain className="size-3.5" />
          {think ? t.thinkOn : t.thinkOff}
        </button>
      </div>

      <div className="flex items-end gap-2 rounded-xl bg-surface p-2 shadow-[var(--shadow-border)] focus-within:shadow-[var(--shadow-border-hover)]">
        <textarea
          ref={ref}
          rows={1}
          maxLength={MAX_LEN}
          disabled={disabled}
          onInput={resize}
          onKeyDown={onKey}
          placeholder={t.placeholder}
          className="max-h-44 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-base text-fg outline-none placeholder:text-subtle disabled:opacity-50"
        />
        {streaming ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={onStop}
            aria-label={t.stop}
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={disabled}
            aria-label={t.send}
          >
            <SendHorizontal className="size-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-subtle">{t.composerHint}</p>
    </form>
  );
}
