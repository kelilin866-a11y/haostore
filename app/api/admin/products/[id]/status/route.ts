import { ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

import { redirectTo, requireAdmin } from "../../product-form";

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
  const status =
    formData.get("status") === ProductStatus.active
      ? ProductStatus.active
      : ProductStatus.inactive;

  await prisma.product.update({
    where: {
      id: params.id,
    },
    data: {
      status,
    },
  });

  return redirectTo("/admin/products", request);
}
