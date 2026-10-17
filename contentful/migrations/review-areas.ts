// Additive migration: retain legacy approvals for the previous application version.
export function migrateReviewAreas(legacy: Record<string, unknown>) {
  const labels: Record<string, string> = {
    Home: "Home",
    home: "Home",
    Coaching: "Coaching",
    coaching: "Coaching",
    "Retreats General": "Retreats & Workshops",
    "retreats-overview": "Retreats & Workshops",
    Retreat: "Retreats & Workshops",
    "event-page": "Retreats & Workshops",
    "Retreats & Workshops": "Retreats & Workshops",
  };
  return Object.fromEntries(
    Object.entries(legacy).map(([locale, value]) => {
      if (!Array.isArray(value)) throw new Error("Invalid legacy testimonial approvals");
      const values = value.flatMap((item: unknown) => {
        if (item === "classes") return [];
        if (typeof item !== "string" || !labels[item])
          throw new Error("Unknown legacy testimonial approval; review before migrating");
        return [labels[item]];
      });
      return [locale, [...new Set(values)]];
    })
  );
}
