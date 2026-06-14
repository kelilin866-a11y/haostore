import {
  confirmPaymentAndDeliverOrder,
  isInventoryChangedError,
} from "@/lib/order-delivery";

export async function deliverLocalStockOrder(orderNo: string) {
  try {
    return await confirmPaymentAndDeliverOrder({
      orderNo,
      note: "付款成功后系统自动发货",
    });
  } catch (error) {
    if (isInventoryChangedError(error)) {
      return {
        ok: false as const,
        message: "库存状态已变化，请稍后重试自动发货",
        status: 409,
      };
    }

    throw error;
  }
}
