const UKURAN = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
} as const;

export function Spinner({
  ukuran = "sm",
  className = "",
}: {
  ukuran?: keyof typeof UKURAN;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Memuat"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${UKURAN[ukuran]} ${className}`}
    />
  );
}
