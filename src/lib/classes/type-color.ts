export function getTypeColor(type: "Yoga" | "Strength" | "HIIT" | "Cardio" | string): string {
  switch (type) {
    case "Yoga":
      return "border-brand-accent/40 bg-brand-accent/10 text-brand-accent";
    case "Strength":
      return "border-brand-dark/40 bg-brand-dark/10 text-brand-dark";
    case "HIIT":
      return "border-brand-copper/40 bg-brand-copper/10 text-brand-copper";
    case "Cardio":
      return "border-brand-rose/40 bg-brand-rose/10 text-brand-rose";
    default:
      return "border-border bg-secondary/50 text-foreground";
  }
}
