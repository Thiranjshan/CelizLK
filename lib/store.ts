import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, UserSession } from './types';

export interface LocalCartItem {
  product: Product;
  quantity: number;
  selected?: boolean;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StoreState {
  cart: LocalCartItem[];
  buyNowItem: LocalCartItem | null;
  guestCart: LocalCartItem[];
  userCarts: Record<string, LocalCartItem[]>;
  user: UserSession | null;
  accessToken: string | null;
  authInitialized: boolean;
  toasts: ToastMessage[];
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCartItemSelection: (productId: string) => void;
  toggleAllCartItems: (selected: boolean) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartSubtotal: () => number;
  getSelectedCartItems: () => LocalCartItem[];

  // Buy Now Actions
  setBuyNowItem: (item: LocalCartItem | null) => void;
  updateBuyNowQuantity: (quantity: number) => void;
  
  // Auth Actions
  setUser: (user: UserSession | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuthInitialized: (initialized: boolean) => void;
  logout: () => void;

  // Toast Actions
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      buyNowItem: null,
      guestCart: [],
      userCarts: {},
      user: null,
      accessToken: null,
      authInitialized: false,
      toasts: [],

      addToCart: (product, quantity = 1) => {
        const { cart, user, userCarts, guestCart, addToast } = get();
        const existingIndex = cart.findIndex((item) => item.product.id === product.id);
        let updatedCart: LocalCartItem[];

        if (existingIndex > -1) {
          updatedCart = [...cart];
          updatedCart[existingIndex].quantity += quantity;
          updatedCart[existingIndex].selected = true;
        } else {
          updatedCart = [...cart, { product, quantity, selected: true }];
        }

        if (user) {
          set({ cart: updatedCart, userCarts: { ...userCarts, [user.id]: updatedCart } });
        } else {
          set({ cart: updatedCart, guestCart: updatedCart });
        }
        addToast('success', `Added "${product.name}" to cart!`);
      },

      removeFromCart: (productId) => {
        const { cart, user, userCarts, guestCart, addToast } = get();
        const item = cart.find((i) => i.product.id === productId);
        const updatedCart = cart.filter((i) => i.product.id !== productId);

        if (user) {
          set({ cart: updatedCart, userCarts: { ...userCarts, [user.id]: updatedCart } });
        } else {
          set({ cart: updatedCart, guestCart: updatedCart });
        }

        if (item) {
          addToast('info', `Removed "${item.product.name}" from cart.`);
        }
      },

      updateQuantity: (productId, quantity) => {
        const { cart, user, userCarts, guestCart } = get();
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        const updatedCart = cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );

        if (user) {
          set({ cart: updatedCart, userCarts: { ...userCarts, [user.id]: updatedCart } });
        } else {
          set({ cart: updatedCart, guestCart: updatedCart });
        }
      },

      toggleCartItemSelection: (productId) => {
        const { cart, user, userCarts, guestCart } = get();
        const updatedCart = cart.map((item) =>
          item.product.id === productId
            ? { ...item, selected: item.selected === undefined ? false : !item.selected }
            : item
        );

        if (user) {
          set({ cart: updatedCart, userCarts: { ...userCarts, [user.id]: updatedCart } });
        } else {
          set({ cart: updatedCart, guestCart: updatedCart });
        }
      },

      toggleAllCartItems: (selected) => {
        const { cart, user, userCarts, guestCart } = get();
        const updatedCart = cart.map((item) => ({ ...item, selected }));

        if (user) {
          set({ cart: updatedCart, userCarts: { ...userCarts, [user.id]: updatedCart } });
        } else {
          set({ cart: updatedCart, guestCart: updatedCart });
        }
      },

      clearCart: () => {
        const { user, userCarts } = get();
        if (user) {
          set({ cart: [], userCarts: { ...userCarts, [user.id]: [] } });
        } else {
          set({ cart: [], guestCart: [] });
        }
      },

      getCartCount: () => {
        return get().cart.filter((item) => item.selected !== false).reduce((total, item) => total + item.quantity, 0);
      },

      getCartSubtotal: () => {
        return get()
          .cart.filter((item) => item.selected !== false)
          .reduce((total, item) => {
            const price = item.product.discountPrice ?? item.product.price;
            return total + price * item.quantity;
          }, 0);
      },

      getSelectedCartItems: () => {
        return get().cart.filter((item) => item.selected !== false);
      },

      setBuyNowItem: (buyNowItem) => set({ buyNowItem }),

      updateBuyNowQuantity: (quantity) => {
        const { buyNowItem } = get();
        if (!buyNowItem) return;
        if (quantity <= 0) {
          set({ buyNowItem: null });
        } else {
          set({ buyNowItem: { ...buyNowItem, quantity } });
        }
      },

      setUser: (newUser) => {
        const { user: currentUser, cart: currentCart, userCarts, guestCart } = get();

        // 1. Save current active cart under current user if logged in
        let updatedUserCarts = { ...userCarts };
        if (currentUser) {
          updatedUserCarts[currentUser.id] = currentCart;
        }

        if (newUser) {
          // 2. Logging in: merge pre-login guest items into target user's cart
          const existingUserCart = updatedUserCarts[newUser.id] || [];
          const mergedCart = [...existingUserCart];

          if (guestCart.length > 0) {
            guestCart.forEach((gItem) => {
              const matchIndex = mergedCart.findIndex((uItem) => uItem.product.id === gItem.product.id);
              if (matchIndex > -1) {
                mergedCart[matchIndex] = {
                  ...mergedCart[matchIndex],
                  quantity: mergedCart[matchIndex].quantity + gItem.quantity,
                  selected: true,
                };
              } else {
                mergedCart.push({ ...gItem, selected: true });
              }
            });
          }

          updatedUserCarts[newUser.id] = mergedCart;
          set({
            user: newUser,
            cart: mergedCart,
            userCarts: updatedUserCarts,
            guestCart: [],
          });
        } else {
          // Logging out / null user
          set({
            user: null,
            cart: guestCart,
            userCarts: updatedUserCarts,
          });
        }
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      setAuthInitialized: (authInitialized) => set({ authInitialized }),

      logout: () => {
        const { user, cart, userCarts } = get();
        let updatedUserCarts = { ...userCarts };
        if (user) {
          updatedUserCarts[user.id] = cart;
        }
        set({
          user: null,
          accessToken: null,
          cart: [],
          guestCart: [],
          userCarts: updatedUserCarts,
        });
        get().addToast('info', 'Logged out successfully');
      },

      addToast: (type, message) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, type, message }],
        }));

        setTimeout(() => {
          get().removeToast(id);
        }, 4000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'celiz-lk-store-v2',
      partialize: (state) => ({ cart: state.cart, userCarts: state.userCarts, guestCart: state.guestCart }),
    }
  )
);
