import { prisma } from '@/lib/prisma';

type PaymentTransactionStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
type PaymentGateway = 'stripe' | 'mercadopago';

const paymentTransactionModel = (prisma as unknown as {
  paymentTransaction: {
    upsert: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<any>;
  };
}).paymentTransaction;

export const paymentTransactionService = {
  async upsertTransaction(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: PaymentGateway;
    amount: number;
    status: PaymentTransactionStatus;
  }) {
    return paymentTransactionModel.upsert({
      where: { externalPaymentId: params.externalPaymentId },
      create: {
        orderId: params.orderId,
        externalPaymentId: params.externalPaymentId,
        gateway: params.gateway,
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

  async updateStatusByExternalId(externalPaymentId: string, status: PaymentTransactionStatus) {
    return paymentTransactionModel.updateMany({
      where: { externalPaymentId },
      data: { status },
    });
  },
};
