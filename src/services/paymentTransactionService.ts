import { prisma } from '@/lib/prisma';

type PaymentTransactionStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

const paymentTransactionModel = (prisma as unknown as {
  paymentTransaction: {
    upsert: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<any>;
  };
}).paymentTransaction;

export const paymentTransactionService = {
  async upsertTransaction(params: {
    orderId: number;
    stripePaymentId: string;
    amount: number;
    status: PaymentTransactionStatus;
  }) {
    return paymentTransactionModel.upsert({
      where: { stripePaymentId: params.stripePaymentId },
      create: {
        orderId: params.orderId,
        stripePaymentId: params.stripePaymentId,
        amount: params.amount,
        status: params.status,
      },
      update: {
        orderId: params.orderId,
        amount: params.amount,
        status: params.status,
      },
    });
  },

  async updateStatusByStripeId(stripePaymentId: string, status: PaymentTransactionStatus) {
    return paymentTransactionModel.updateMany({
      where: { stripePaymentId },
      data: { status },
    });
  },
};
