import { OrderQueryForm } from "@/components/site/OrderQueryForm";

export default function OrderQueryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">订单查询</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          通过订单号和联系方式查询
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          输入下单时保存的订单号和联系方式。未发货订单只展示状态和人工付款说明，已发货订单会展示发货内容。
        </p>
      </div>

      <OrderQueryForm />
    </div>
  );
}
