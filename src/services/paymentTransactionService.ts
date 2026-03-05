import { prisma } from '@/lib/prisma';

type PaymentTransactionStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
type PaymentGateway = 'stripe' | 'mercadopago';

export const paymentTransactionService = {
  async upsertTransaction(params: {
    orderId: number;
    externalPaymentId: string;
    gateway: PaymentGateway;
    amount: number;
    status: PaymentTransactionStatus;
  }) {
    return prisma.paymentTransaction.upsert({
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
    return prisma.paymentTransaction.updateMany({
      where: { externalPaymentId },
      data: { status },
    });
  },
};
