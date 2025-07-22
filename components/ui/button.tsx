import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#2C3444] text-primary-foreground shadow-md hover:bg-[#475570] hover:shadow-lg active:bg-[#1E2430] active:shadow-md active:translate-y-[1px] transform-gpu",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-[#E53E3E] hover:shadow-lg active:bg-[#C53030] active:shadow-md active:translate-y-[1px] transform-gpu focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/80 dark:hover:bg-destructive dark:active:bg-destructive/90",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent/80 hover:shadow-md hover:border-accent-foreground/20 active:bg-accent/60 active:shadow-sm active:translate-y-[1px] transform-gpu dark:bg-input/20 dark:border-input/80 dark:hover:bg-input/40 dark:hover:border-input dark:active:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 hover:shadow-lg active:bg-secondary/80 active:shadow-md active:translate-y-[1px] transform-gpu",
        ghost:
          "hover:bg-accent/90 hover:shadow-sm active:bg-accent/80 active:translate-y-[1px] transform-gpu dark:hover:bg-accent/80 dark:active:bg-accent/70",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/90 active:text-primary/70 hover:scale-[1.02] transform-gpu",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-11 rounded-md px-7 has-[>svg]:px-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }