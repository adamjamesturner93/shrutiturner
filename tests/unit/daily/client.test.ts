import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockCallObject = {
  leave: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
  participants: ReturnType<typeof vi.fn>;
  setLocalAudio: ReturnType<typeof vi.fn>;
  setLocalVideo: ReturnType<typeof vi.fn>;
};

function createMockCallObject(): MockCallObject {
  return {
    leave: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    join: vi.fn().mockResolvedValue(undefined),
    participants: vi.fn().mockReturnValue({}),
    setLocalAudio: vi.fn(),
    setLocalVideo: vi.fn(),
  };
}

describe("daily client managed call lifecycle", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("releases the previous call object before creating a new one", async () => {
    const firstCallObject = createMockCallObject();
    const secondCallObject = createMockCallObject();
    const createCallObject = vi
      .fn()
      .mockReturnValueOnce(firstCallObject)
      .mockReturnValueOnce(secondCallObject);

    (globalThis as { window?: unknown }).window = {
      DailyIframe: {
        createCallObject,
      },
    };

    const { createManagedCallObject, releaseManagedCallObject } =
      await import("@/lib/daily/client");

    const createdFirst = await createManagedCallObject();
    const createdSecond = await createManagedCallObject();

    expect(createdFirst).toBe(firstCallObject);
    expect(createdSecond).toBe(secondCallObject);
    expect(createCallObject).toHaveBeenCalledTimes(2);
    expect(firstCallObject.leave).toHaveBeenCalledTimes(1);
    expect(firstCallObject.destroy).toHaveBeenCalledTimes(1);

    await releaseManagedCallObject(createdSecond);

    expect(secondCallObject.leave).toHaveBeenCalledTimes(1);
    expect(secondCallObject.destroy).toHaveBeenCalledTimes(1);
  });
});
