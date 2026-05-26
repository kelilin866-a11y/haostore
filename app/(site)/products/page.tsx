import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/ProductCard";
import { categories, products } from "@/lib/mock-data";

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">产品中心</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">虚拟商品列表</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          当前阶段使用 mock 数据展示分类、库存、价格和购买入口，不创建真实订单。
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Badge key={category} variant={index === 0 ? "deal" : "outline"} className="px-3 py-1">
            {category}
          </Badge>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
