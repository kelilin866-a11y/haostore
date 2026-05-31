import { prisma } from "@/lib/db";

import { redirectTo, requireAdmin } from "../../category-form";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  const authRedirect = requireAdmin(request);
  if (authRedirect) {
    return authRedirect;
  }

  const formData = await request.formData();
  const isActive = formData.get("isActive") === "true";

  await prisma.category.update({
    where: { id: params.id },
    data: { isActive },
  });

  return redirectTo("/admin/categories", request);
}
