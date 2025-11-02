import { Button } from "../button";
import { cn } from "@/lib/utils";

interface PrimaryButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

export function PrimaryButton({ children, className, ...props }: PrimaryButtonProps) {
  return (
    <Button 
      className={cn(
        "bg-primary-button-bg text-primary-button-text border-primary-button-border hover:bg-primary-button-hover-bg hover:text-primary-button-hover-text font-sans flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
