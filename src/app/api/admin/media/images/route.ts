import { handleApiRoute, apiOk, badRequest, ApiError } from "@/lib/api/route";
import { listAdminImages } from "@/lib/content/admin-media";

export const GET = handleApiRoute(
  async ({ request }) => {
    const params = new URL(request.url).searchParams;
    const query = (params.get("q") || "").trim();
    const page = Number(params.get("page") || "1");
    if (query.length > 200 || !Number.isInteger(page) || page < 1 || page > 1000)
      throw badRequest("Check the image search and page.");
    try {
      const response = apiOk(await listAdminImages(query, page));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch {
      throw new ApiError(
        503,
        "MEDIA_UNAVAILABLE",
        "The Contentful image library is unavailable. Check its configuration or try again shortly."
      );
    }
  },
  { auth: "staff_admin" }
);
