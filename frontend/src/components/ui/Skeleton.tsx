interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-[120px] rounded-2xl' }: SkeletonProps) {
  return <div className={`qe-card animate-pulse ${className}`} />;
}
