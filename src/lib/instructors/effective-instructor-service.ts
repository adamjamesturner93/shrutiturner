import { db } from "@/lib/db";
import { getClassDefinitionBySlug, getInstructorProfilesByIds } from "@/lib/content";

export async function resolveClassInstructorSnapshot(params: {
  classDefinitionSlug: string;
  instructorUserId: string;
  instructorProfileEntryId?: string | null;
}) {
  const [classDef, instructorUser] = await Promise.all([
    getClassDefinitionBySlug(params.classDefinitionSlug),
    db.user.findUnique({
      where: { id: params.instructorUserId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        name: true,
        instructorProfileEntryId: true,
      },
    }),
  ]);

  if (!classDef) {
    throw new Error("CLASS_DEFINITION_NOT_FOUND");
  }
  if (!instructorUser) {
    throw new Error("INSTRUCTOR_NOT_FOUND");
  }

  const resolvedProfileEntryId =
    params.instructorProfileEntryId ||
    instructorUser.instructorProfileEntryId ||
    classDef.defaultInstructorProfileEntryId ||
    null;
  const resolvedProfile = resolvedProfileEntryId
    ? (await getInstructorProfilesByIds([resolvedProfileEntryId]))[0]
    : undefined;

  return {
    classDef,
    instructorUser,
    resolvedProfileEntryId,
    instructorNameSnapshot:
      resolvedProfile?.name ||
      [instructorUser.firstName, instructorUser.lastName].filter(Boolean).join(" ").trim() ||
      instructorUser.name ||
      null,
    instructorBioSnapshot: resolvedProfile?.bio || null,
  };
}
