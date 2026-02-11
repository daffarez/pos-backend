export interface OrderCreatedEvent {
  orderId: string;
  outletId: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
}
