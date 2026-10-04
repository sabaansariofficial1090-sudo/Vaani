import { cn } from "@/lib/utils";

export function VaaniMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("text-fg", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.08" />
      <path
        d="M8 9.5h3.1L16 22.5 20.9 9.5H24L17.4 24h-2.8L8 9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
