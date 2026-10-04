import * as Dialog from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { copy } from "@/lib/chat/copy";
import { ChatRequestError, streamChat } from "@/lib/chat/stream";
import { selectActive, useChatStore } from "@/lib/chat/store";
import type { Mode } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Composer } from "./composer";
import { Sidebar } from "./sidebar";
import { Thread } from "./thread";
import { VaaniMark } from "./logo";

type BannerKey = "credits" | "unavailable" | "error";

function bannerKey(err: unknown): BannerKey {
  if (err instanceof ChatRequestError) {
    if (err.code === "credits") return "credits";
    if (err.code === "unavailable" || err.status === 503) return "unavailable";
  }
  return "error";
}

export function AppShell() {
  const hydrated = useChatStore((s) => s.hydrated);
  const locale = useChatStore((s) => s.locale);
  const think = useChatStore((s) => s.think);
  const active = useChatStore(selectActive);
  const setThink = useChatStore((s) => s.setThink);
  const setMode = useChatStore((s) => s.setMode);
  const newChat = useChatStore((s) => s.newChat);
  const appendUser = useChatStore((s) => s.appendUser);
  const appendAssistantPlaceholder = useChatStore((s) => s.appendAssistantPlaceholder);
  const patchAssistant = useChatStore((s) => s.patchAssistant);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const dropLastAssistant = useChatStore((s) => s.dropLastAssistant);

  const [menuOpen, setMenuOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [banner, setBanner] = useState<BannerKey | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const t = copy[locale];
  const mode: Mode = active?.mode ?? "chat";
  const messages = active?.messages ?? [];

  useEffect(() => {
    const unsub = useChatStore.persist.onFinishHydration(() => {
      useChatStore.getState().setHydrated(true);
    });
    if (useChatStore.persist.hasHydrated()) {
      useChatStore.getState().setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
  }, [locale]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string, opts?: { regenerate?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      setBanner(null);

      if (!opts?.regenerate) {
        appendUser(trimmed);
      }

      const state = useChatStore.getState();
      const convo = selectActive(state);
      if (!convo) return;

      const history = convo.messages
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistant = appendAssistantPlaceholder();
      const ac = new AbortController();
      abortRef.current = ac;
      setStreaming(true);

      let assembled = "";
      try {
        await streamChat({
          messages: history,
          mode: convo.mode,
          think: state.think,
          locale: state.locale,
          signal: ac.signal,
          onDelta: (chunk) => {
            assembled += chunk;
            patchAssistant(assistant.id, assembled);
          },
        });
        if (!assembled.trim()) {
          removeMessage(assistant.id);
          setBanner("error");
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          if (!assembled.trim()) removeMessage(assistant.id);
        } else {
          if (!assembled.trim()) removeMessage(assistant.id);
          setBanner(bannerKey(err));
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [
      appendAssistantPlaceholder,
      appendUser,
      patchAssistant,
      removeMessage,
      streaming,
    ],
  );

  const regen = useCallback(() => {
    if (streaming) return;
    dropLastAssistant();
    const convo = selectActive(useChatStore.getState());
    const lastUser = [...(convo?.messages ?? [])]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUser) void send(lastUser.content, { regenerate: true });
  }, [dropLastAssistant, send, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <TooltipProvider>
      <div className="flex h-dvh bg-bg text-fg">
        <div className="hidden h-full md:flex">
          <Sidebar />
        </div>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-2 border-b border-border px-2 md:hidden">
            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger asChild>
                <Button variant="quiet" size="icon" aria-label={t.openMenu}>
                  <Menu className="size-5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-bg/70 md:hidden" />
                <Dialog.Content
                  className="fixed inset-y-0 left-0 z-50 h-full outline-none md:hidden"
                  aria-describedby={undefined}
                >
                  <Dialog.Title className="sr-only">{t.chats}</Dialog.Title>
                  <Sidebar onClose={() => setMenuOpen(false)} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <VaaniMark className="size-7" />
            <span className="font-display text-sm font-semibold">{t.app}</span>
            <Button
              variant="quiet"
              size="sm"
              className="ml-auto"
              onClick={() => newChat(mode)}
            >
              {t.newChat}
            </Button>
          </header>

          {hydrated ? (
            <Thread
              locale={locale}
              messages={messages}
              streaming={streaming}
              banner={banner ? t[banner] : null}
              onPick={(text) => void send(text)}
              onRegen={regen}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted">{t.app}</p>
            </div>
          )}

          <Composer
            locale={locale}
            mode={mode}
            think={think}
            streaming={streaming}
            onMode={(m) => {
              if (!active) newChat(m);
              else setMode(m);
            }}
            onThink={setThink}
            onSend={(text) => void send(text)}
            onStop={stop}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
