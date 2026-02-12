export type OrderCreatedEvent = {
  orderId: string;
  outletId: string;
  total: number;
  paymentMethod: string;
  createdAt: number;
};
