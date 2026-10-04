import { Languages, Plus, Trash2, X } from "lucide-react";
import { copy } from "@/lib/chat/copy";
import { selectActive, useChatStore } from "@/lib/chat/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VaaniMark } from "./logo";

export function Sidebar({
  onClose,
  className,
}: {
  onClose?: () => void;
  className?: string;
}) {
  const locale = useChatStore((s) => s.locale);
  const t = copy[locale];
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const newChat = useChatStore((s) => s.newChat);
  const setActive = useChatStore((s) => s.setActive);
  const remove = useChatStore((s) => s.remove);
  const setLocale = useChatStore((s) => s.setLocale);

  return (
    <aside
      className={cn("flex h-full w-72 flex-col bg-surface text-fg", className)}
    >
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-3">
        <VaaniMark className="size-8" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold tracking-tight">{t.app}</p>
          <p className="truncate text-xs text-muted">{t.tagline}</p>
        </div>
        {onClose ? (
          <Button variant="quiet" size="iconSm" onClick={onClose} aria-label={t.closeMenu}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => {
            newChat(selectActive(useChatStore.getState())?.mode ?? "chat");
            onClose?.();
          }}
        >
          <Plus className="size-4" />
          {t.newChat}
        </Button>
      </div>

      <p className="px-4 pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
        {t.chats}
      </p>

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">{t.emptyBody}</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActive(c.id);
                      onClose?.();
                    }}
                    className={cn(
                      "flex h-11 w-full items-center rounded-md pr-10 pl-3 text-left text-sm transition-[background-color,color] duration-[var(--motion-quick)]",
                      active
                        ? "bg-surface-2 text-fg"
                        : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    <span className="truncate">{c.title || t.untitled}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={t.delete}
                    onClick={() => {
                      if (window.confirm(t.confirmDelete)) remove(c.id);
                    }}
                    className="absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-sm text-subtle opacity-80 transition-opacity duration-[var(--motion-quick)] hover:text-danger md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="quiet"
          size="sm"
          className="w-full justify-start"
          onClick={() => setLocale(locale === "en" ? "hi" : "en")}
        >
          <Languages className="size-4" />
          {t.language}
        </Button>
      </div>
    </aside>
  );
}
