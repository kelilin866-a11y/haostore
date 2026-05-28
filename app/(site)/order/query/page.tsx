import { OrderQueryForm } from "@/components/site/OrderQueryForm";

export default function OrderQueryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">订单查询</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          通过订单号或联系方式查询
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          可以只输入订单号，也可以只输入下单联系方式。联系方式匹配到多个订单时，会显示全部结果。
        </p>
      </div>

      <OrderQueryForm />
    </div>
  );
}
