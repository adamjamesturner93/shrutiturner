import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { programmePost: { findMany: mocks.find } } }));
vi.mock("@/lib/programmes/access", () => ({ programmeAccess: mocks.access }));
import { listProgrammePosts } from "@/lib/programmes/community-service";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.access.mockResolvedValue({
    cohort: { id: "owned" },
    staff: false,
    canExercise: false,
    now: new Date("2027-02-01"),
  });
});
it("pages cohort-scoped roots and their replies without exposing protected references", async () => {
  mocks.find
    .mockResolvedValueOnce([{ id: "one" }, { id: "two" }, { id: "three" }])
    .mockResolvedValueOnce([
      {
        id: "one",
        authorId: "other",
        title: "Discussion",
        body: "Hello",
        resourceIds: ["exercise"],
        createdAt: new Date("2027-01-25"),
      },
    ]);
  const result = await listProgrammePosts("member", "owned", { limit: 2 });
  expect(mocks.access).toHaveBeenCalledWith("member", "owned", "community");
  expect(mocks.find.mock.calls[0][0]).toMatchObject({
    where: { programmeId: "owned", parentId: null },
    take: 3,
  });
  expect(mocks.find.mock.calls[1][0]).toMatchObject({
    where: {
      programmeId: "owned",
      OR: [{ id: { in: ["one", "two"] } }, { parentId: { in: ["one", "two"] } }],
    },
  });
  expect(result.nextCursor).toBe("two");
  expect(result.posts[0].resourceIds).toEqual([]);
});
it("enforces community access before reading any posts", async () => {
  mocks.access.mockRejectedValue(new Error("COMMUNITY_CLOSED"));
  await expect(listProgrammePosts("member", "owned", { limit: 2 })).rejects.toThrow(
    "COMMUNITY_CLOSED"
  );
  expect(mocks.find).not.toHaveBeenCalled();
});
