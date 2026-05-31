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
  tags?: string[];
  price: number;
  stock: number;
};

export function ProductCard({ product }: { product: ProductCardValue }) {
  const productHref = `/products/${encodeURIComponent(product.slug)}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-sm text-slate-400">
        {product.category} 商品图占位
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="leading-6">{product.title}</CardTitle>
          <Badge variant="deal">{product.category}</Badge>
        </div>
        <p className="text-sm leading-6 text-slate-500">{product.description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(product.tags ?? ["Stripe Checkout", "文本发货"]).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">价格起</p>
            <p className="text-2xl font-semibold text-primary">
              {formatCurrency(product.price)}
            </p>
          </div>
          <p className="text-sm text-slate-500">库存 {product.stock}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="deal" className="w-full" asChild>
          <Link href={productHref}>立即购买</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
