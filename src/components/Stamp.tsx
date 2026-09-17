export default function Stamp({
  label = "Accordé",
  sub,
  size = "md",
  animate = false,
  className = "",
}: {
  label?: string;
  sub?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}) {
  const sizes = { sm: "text-lg", md: "text-3xl", lg: "text-4xl sm:text-5xl" };
  return (
    <span className={`stamp ${sizes[size]} ${animate ? "stamp--land" : ""} ${className}`} aria-hidden="true">
      {label}
      {sub && <small>{sub}</small>}
    </span>
  );
}
