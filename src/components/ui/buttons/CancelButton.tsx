import { Button } from "../button";
import { cn } from "@/lib/utils";

interface CancelButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode;
}

export function CancelButton({ children, className, ...props }: CancelButtonProps) {
  return (
    <Button 
      variant="outline"
      className={cn(
        "!bg-cancel-button-bg !text-cancel-button-text !border-cancel-button-border hover:!bg-cancel-button-hover-bg hover:!text-cancel-button-hover-text font-sans flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
