import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive font-mono tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/80 hover:bg-primary/90 hover:border-primary neon-border hover:neon-border-strong transform hover:scale-[1.02] active:scale-[0.98] neon-text",
        destructive:
          "bg-destructive text-white border border-destructive/60 hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:border-destructive hover:shadow-[0_0_15px_oklch(0.6_0.22_20/50%)]",
        outline:
          "border-2 border-accent/80 bg-background/30 backdrop-blur-sm hover:bg-accent/20 hover:text-accent-foreground neon-border hover:neon-border-strong neon-text",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary/80 hover:bg-secondary/80 neon-border neon-text",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground border border-transparent hover:border-accent/60 neon-text",
        link: "text-primary underline-offset-4 hover:underline border border-transparent neon-text-strong",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3 rounded-sm",
        sm: "h-8 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-sm px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
