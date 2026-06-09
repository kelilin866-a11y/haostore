import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type ProductCardValue = {
  slug: string;
  title: string;
  category: string;
  description: string;
  coverImage?: string | null;
  tags?: string[];
  price: number;
  stock: number;
};

function getHttpImageUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

export function ProductCard({
  product,
  buyButtonText = "立即购买",
}: {
  product: ProductCardValue;
  buyButtonText?: string;
}) {
  const productHref = `/products/${encodeURIComponent(product.slug)}`;
  const coverImageUrl = getHttpImageUrl(product.coverImage);

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-[#E2E8F0] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      {coverImageUrl ? (
        <div
          aria-label={`${product.title} 商品图`}
          className="aspect-[16/9] bg-slate-100 bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url("${coverImageUrl}")` }}
        />
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#EFF6FF] to-[#F1F5F9] text-sm text-[#2563EB]">
          {product.category} 商品图占位
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="leading-6 text-[#0F172A]">
            {product.title}
          </CardTitle>
          <Badge className="bg-[#EFF6FF] text-[#2563EB] hover:bg-[#EFF6FF]">
            {product.category}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-[#64748B]">{product.description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(product.tags ?? ["Stripe Checkout", "文本发货"]).map((tag) => (
            <Badge
              key={tag}
              className="bg-[#ECFDF5] text-emerald-700 hover:bg-[#ECFDF5]"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#64748B]">价格起</p>
            <p className="text-2xl font-bold text-[#14B8A6]">
              {formatCurrency(product.price)}
            </p>
          </div>
          <p className="rounded-full bg-[#ECFDF5] px-3 py-1 text-sm font-medium text-emerald-700">
            库存 {product.stock}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-[#14B8A6] text-white hover:bg-[#0F9F93]"
          asChild
        >
          <Link href={productHref}>{buyButtonText}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
