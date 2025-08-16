import * as React from "react";

import { cn } from "~/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card/80 text-card-foreground border-accent/30 relative flex flex-col gap-6 overflow-hidden rounded-sm border-2 py-6 backdrop-blur-sm",
        "shadow-[0_0_20px_oklch(0.6_0.25_180/15%)] hover:shadow-[0_0_30px_oklch(0.6_0.25_180/25%)]",
        "before:from-accent/5 before:to-primary/5 before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:via-transparent",
        "after:via-accent/60 after:absolute after:top-0 after:right-0 after:left-0 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent",
        "hover:border-accent/50 transition-all duration-300",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header relative grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        "after:via-accent/40 after:absolute after:right-6 after:bottom-0 after:left-6 after:h-px after:bg-gradient-to-r after:from-transparent after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-accent font-mono leading-none font-semibold tracking-wide",
        "text-shadow-[0_0_5px_oklch(0.6_0.25_180/50%)]",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground font-mono text-sm opacity-80",
        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
