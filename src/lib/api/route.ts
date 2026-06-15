import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isOwnerAdminRole, isStaffAdminRole } from "@/lib/authz/roles";

type AuthPolicy = "public" | "user" | "staff_admin" | "owner_admin";

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type RouteSessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

export type RouteContext = {
  request: Request;
  requestId: string;
  requestIp: string;
  path: string;
  sessionUser: RouteSessionUser | null;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "";
  }
  return request.headers.get("x-real-ip") || "";
}

async function requirePolicyUser(policy: AuthPolicy): Promise<RouteSessionUser | null> {
  if (policy === "public") return null;

  const session = await auth();
  const user = session?.user;
  if (!user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
  }

  if (policy === "staff_admin" && !isStaffAdminRole(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  if (policy === "owner_admin" && !isOwnerAdminRole(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "Forbidden");
  }

  return user;
}

function buildErrorResponse(
  error: unknown,
  context: Pick<RouteContext, "path" | "requestId" | "sessionUser">
) {
  if (error instanceof ApiError) {
    return NextResponse.json<ApiFailure>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected API failure";
  console.error("[api]", {
    path: context.path,
    requestId: context.requestId,
    userId: context.sessionUser?.id || null,
    error: message,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json<ApiFailure>(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 }
  );
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, init);
}

export function apiCreated<T>(data: T, init?: ResponseInit) {
  return apiOk(data, { status: 201, ...init });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function badRequest(message: string, details?: unknown) {
  return new ApiError(400, "BAD_REQUEST", message, details);
}

export function unauthorized(message = "Unauthorized") {
  return new ApiError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return new ApiError(403, "FORBIDDEN", message);
}

export function tooManyRequests(message: string, details?: unknown) {
  return new ApiError(429, "TOO_MANY_REQUESTS", message, details);
}

export function notFound(message: string) {
  return new ApiError(404, "NOT_FOUND", message);
}

export function conflict(message: string, details?: unknown) {
  return new ApiError(409, "CONFLICT", message, details);
}

export function gone(message: string, details?: unknown) {
  return new ApiError(410, "GONE", message, details);
}

export function serviceUnavailable(message: string, details?: unknown) {
  return new ApiError(503, "SERVICE_UNAVAILABLE", message, details);
}

export function upstreamFailure(message: string, details?: unknown) {
  return new ApiError(502, "UPSTREAM_FAILURE", message, details);
}

export function handleApiRoute(
  handler: (context: RouteContext, handlerContext?: unknown) => Promise<Response>,
  options?: { auth?: AuthPolicy }
) {
  const policy = options?.auth || "public";

  return async function routeHandler(request: Request, handlerContext?: unknown) {
    const url = new URL(request.url);
    const requestId = request.headers.get("x-request-id") || randomUUID();
    let context: RouteContext = {
      request,
      requestId,
      requestIp: getClientIp(request),
      path: url.pathname,
      sessionUser: null,
    };

    try {
      context = {
        ...context,
        sessionUser: await requirePolicyUser(policy),
      };
      const response = await handler(context, handlerContext);
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const response = buildErrorResponse(error, context);
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
