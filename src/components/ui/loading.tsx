import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = ({ size = "md", className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton = ({ className, lines = 3 }: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 bg-muted rounded animate-pulse",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export const LoadingOverlay = ({ isLoading, children, message = "Loading..." }: LoadingOverlayProps) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};