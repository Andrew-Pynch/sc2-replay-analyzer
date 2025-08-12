import * as React from "react"

import { cn } from "~/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/20 border-accent/60 flex h-9 w-full min-w-0 rounded-sm border-2 bg-background/20 backdrop-blur-sm px-3 py-1 text-base shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "font-mono tracking-wide neon-text neon-border",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[2px] focus-visible:bg-input/40 focus-visible:neon-border-strong",
        "hover:border-accent/80 hover:neon-border-strong",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "placeholder:text-muted-foreground/70 placeholder:italic placeholder:font-normal",
        className
      )}
      {...props}
    />
  )
}

export { Input }
