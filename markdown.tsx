import { Check, Copy } from "lucide-react";
import { useState, type ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function CodeBlock({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"code">) {
  const text = String(children).replace(/\n$/, "");
  const isBlock = Boolean(className) || text.includes("\n");
  const [copied, setCopied] = useState(false);

  if (!isBlock) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  const lang = /language-([a-z0-9+-]+)/i.exec(className ?? "")?.[1] ?? "";

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between bg-surface px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-subtle">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex size-8 items-center justify-center rounded-sm text-muted transition-[color,background-color] duration-[length:var(--motion-quick)] hover:bg-surface-2 hover:text-fg"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <pre className="m-0 rounded-none shadow-none">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="prose-chat">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          code: CodeBlock,
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}

export function TypingDots({ label }: { label: string }) {
  return (
    <p className={cn("shimmer text-sm font-medium tracking-wide")} aria-live="polite">
      {label}
    </p>
  );
}
