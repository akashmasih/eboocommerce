import { orderRepository } from '../repositories/orderRepository';
import { publishEvent } from '../shared/utils/eventBus';
import { NotFoundError, ValidationError } from '../shared/utils/errors';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface CheckoutInput {
  userId: string;
  items: OrderItem[];
}

/**
 * Order Service - Business Logic Layer
 * Handles order business logic, validation, and event publishing
 */
export class OrderService {
  /**
   * Create order from checkout
   */
  async checkout(input: CheckoutInput) {
    // Business validation
    if (!input.userId) {
      throw new ValidationError('UserId is required');
    }
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Order items are required');
    }

    // Calculate total
    const total = input.items.reduce((sum, item) => {
      if (item.quantity <= 0 || item.price < 0) {
        throw new ValidationError('Invalid item quantity or price');
      }
      return sum + item.quantity * item.price;
    }, 0);

    // Create order
    const order = await orderRepository.create(input.userId, input.items, total);

    // Publish event
    await publishEvent('orders', 'order.created', {
      orderId: order.id,
      userId: input.userId,
      total
    });

    return order;
  }

  /**
   * Get order by ID
   */
  async getById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }
    return order;
  }

  /**
   * List orders by user
   */
  async listByUser(userId: string) {
    if (!userId) {
      throw new ValidationError('UserId is required');
    }
    return orderRepository.findByUser(userId);
  }

  /**
   * Cancel order
   */
  async cancel(id: string) {
    // Check if order exists
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Business validation: can only cancel created (pending) orders
    if (order.status !== 'CREATED') {
      throw new ValidationError('Only pending orders can be canceled');
    }

    // Update status
    const updatedOrder = await orderRepository.updateStatus(id, 'CANCELED');

    // Publish event
    await publishEvent('orders', 'order.canceled', {
      orderId: updatedOrder.id
    });

    return updatedOrder;
  }
}

// Export singleton instance
export const orderService = new OrderService();
