import { Order, CreateOrderDTO, PaginatedResponse, MARKETPLACE_CONFIG } from '../models';

export class OrderService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/marketplace') {
    this.baseUrl = baseUrl;
  }

  async createOrder(orderData: CreateOrderDTO): Promise<{ order: Order; clientSecret: string }> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
    
    const data = await response.json();
    return data.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`);
    if (!response.ok) throw new Error('Failed to fetch order');
    const data = await response.json();
    return data.data;
  }

  async getUserOrders(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Order>> {
    const response = await fetch(`${this.baseUrl}/orders?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    const data = await response.json();
    return data.data;
  }

  async requestRefund(orderId: string, reason: string): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) throw new Error('Failed to request refund');
    const data = await response.json();
    return data.data;
  }

  calculateTotal(priceCents: number): { subtotal: number; commission: number; total: number } {
    const subtotal = priceCents;
    const commission = Math.round(priceCents * MARKETPLACE_CONFIG.COMMISSION_RATE);
    const total = subtotal;
    
    return { subtotal, commission, total };
  }

  formatOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending Payment',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return statusMap[status] || status;
  }
}