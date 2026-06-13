type EpayPaymentInput = {
  pid: string;
  key: string;
  type: "alipay" | "wxpay";
  outTradeNo: string;
  notifyUrl: string;
  returnUrl: string;
  name: string;
  money: string;
};

export class EpayPaymentAdapter {
  createPayment(_input: EpayPaymentInput) {
    throw new Error("Epay adapter is reserved but not enabled in this phase");
  }

  verifyNotify(_params: Record<string, string>) {
    throw new Error("Epay adapter is reserved but not enabled in this phase");
  }

  buildSign(_params: Record<string, string>) {
    throw new Error("Epay adapter is reserved but not enabled in this phase");
  }

  verifySign(_params: Record<string, string>) {
    throw new Error("Epay adapter is reserved but not enabled in this phase");
  }
}
