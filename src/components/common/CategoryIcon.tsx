import { getCategoryIcon } from "@/utils/icons";
import { cn } from "@/utils/cn";

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: "sm" | "md";
  className?: string;
}

/** Category glyph on a soft tint of the category's colour. */
export function CategoryIcon({ icon, color, size = "md", className }: CategoryIconProps) {
  const Icon = getCategoryIcon(icon);
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-xl", size === "sm" ? "size-8" : "size-10", className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
      aria-hidden="true"
    >
      <Icon className={size === "sm" ? "size-4" : "size-4.5"} />
    </span>
  );
}
