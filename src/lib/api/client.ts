export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export function isApiSuccess<T>(payload: unknown): payload is ApiSuccess<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    (payload as { success?: unknown }).success === true &&
    "data" in payload
  );
}

export function getApiErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: { message?: unknown } }).error?.message === "string"
  ) {
    return (payload as { error: { message: string } }).error.message;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallback;
}
