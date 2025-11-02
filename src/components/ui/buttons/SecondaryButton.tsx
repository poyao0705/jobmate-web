import { Button } from "../button";
import { cn } from "@/lib/utils";

interface SecondaryButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

export function SecondaryButton({ children, className, ...props }: SecondaryButtonProps) {
  return (
    <Button 
      variant="outline"
      className={cn(
        "!bg-secondary-button-bg !text-secondary-button-text !border-secondary-button-border hover:!bg-secondary-button-hover-bg hover:!text-secondary-button-hover-text transition-colors font-sans text-sm sm:text-base flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
