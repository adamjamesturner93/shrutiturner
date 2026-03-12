export function getTypeColor(type: "Yoga" | "Strength" | "HIIT" | "Cardio" | string): string {
  switch (type) {
    case "Yoga":
      return "border-[#4B5B32]/40 bg-[#4B5B32]/10 text-[#4B5B32]";
    case "Strength":
      return "border-[#2E1F33]/40 bg-[#2E1F33]/10 text-[#2E1F33]";
    case "HIIT":
      return "border-[#B85C38]/40 bg-[#B85C38]/10 text-[#B85C38]";
    case "Cardio":
      return "border-[#8B4A55]/40 bg-[#8B4A55]/10 text-[#8B4A55]";
    default:
      return "border-border bg-secondary/50 text-foreground";
  }
}
