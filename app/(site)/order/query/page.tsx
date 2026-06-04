import { OrderQueryForm } from "@/components/site/OrderQueryForm";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function OrderQueryPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold text-accentblue">订单查询</p>
        <h1 className="mt-2 text-3xl font-bold text-primary">
          {settings.order_query_page_title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {settings.order_query_page_description}
        </p>
      </div>

      <OrderQueryForm
        buttonText={settings.order_query_button_text}
        contactPlaceholder={settings.order_query_input_placeholder}
        helpText={settings.order_query_help_text}
      />
    </div>
  );
}
