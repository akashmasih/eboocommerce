import { cartRepository } from '../repositories/cartRepository';
import { NotFoundError, ValidationError } from '../shared/utils/errors';

export interface GetCartInput {
  userId?: string;
  guestId?: string;
}

export interface AddItemInput {
  userId?: string;
  guestId?: string;
  productId: string;
  quantity: number;
}

export interface UpdateItemInput {
  userId: string;
  productId: string;
  quantity: number;
}

export interface RemoveItemInput {
  userId: string;
  productId: string;
}

/**
 * Cart Service - Business Logic Layer
 * Handles cart business logic, validation, and orchestration
 */
export class CartService {
  /**
   * Get user's cart
   */
  async getCart(input: GetCartInput) {
    // Business validation
    if (!input.userId && !input.guestId) {
      throw new ValidationError('userId or guestId is required');
    }

    // Find or create cart
    let cart = input.userId
      ? await cartRepository.findByUserId(input.userId)
      : await cartRepository.findByGuestId(input.guestId!);

    if (!cart) {
      // Create new cart if doesn't exist
      cart = await cartRepository.create({
        userId: input.userId,
        guestId: input.guestId
      });
    }

    return cart;
  }

  /**
   * Add item to cart
   */
  async addItem(input: AddItemInput) {
    // Business validation
    if (!input.userId && !input.guestId) {
      throw new ValidationError('userId or guestId is required');
    }
    if (input.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    // Get or create cart
    let cart = input.userId
      ? await cartRepository.findByUserId(input.userId)
      : await cartRepository.findByGuestId(input.guestId!);

    if (!cart) {
      cart = await cartRepository.create({
        userId: input.userId,
        guestId: input.guestId
      });
    }

    // Add item
    await cartRepository.addItem(cart.id, input.productId, input.quantity);

    // Return updated cart
    return cartRepository.findById(cart.id);
  }

  /**
   * Update item quantity
   */
  async updateItem(input: UpdateItemInput) {
    // Business validation
    if (input.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    // Get cart
    const cart = await cartRepository.findByUserId(input.userId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    // Update item
    await cartRepository.updateItem(cart.id, input.productId, input.quantity);

    // Return updated cart
    return cartRepository.findById(cart.id);
  }

  /**
   * Remove item from cart
   */
  async removeItem(input: RemoveItemInput) {
    // Get cart
    const cart = await cartRepository.findByUserId(input.userId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    // Remove item
    await cartRepository.removeItem(cart.id, input.productId);

    // Return updated cart
    return cartRepository.findById(cart.id);
  }
}

// Export singleton instance
export const cartService = new CartService();
