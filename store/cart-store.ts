import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']
type ProductOption = { name: string, price: number }

export interface CartItem {
    id: string
    productId: string
    product: Product
    quantity: number
    selectedOptions: ProductOption[]
}

interface CartState {
    items: CartItem[]
    addItem: (product: Product, quantity: number, options: ProductOption[]) => void
    removeItem: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    clearCart: () => void
    totalPrice: () => number
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, quantity, options) => set((state) => {
                const newItem: CartItem = {
                    id: Math.random().toString(36).substring(7),
                    productId: product.id,
                    product,
                    quantity,
                    selectedOptions: options
                }
                return { items: [...state.items, newItem] }
            }),
            removeItem: (itemId) => set((state) => ({
                items: state.items.filter((i) => i.id !== itemId)
            })),
            updateQuantity: (itemId, quantity) => set((state) => {
                if (quantity <= 0) {
                    return { items: state.items.filter(i => i.id !== itemId) }
                }
                return {
                    items: state.items.map(i => i.id === itemId ? { ...i, quantity } : i)
                }
            }),
            clearCart: () => set({ items: [] }),
            totalPrice: () => {
                const state = get()
                return state.items.reduce((total, item) => {
                    const optionsPrice = item.selectedOptions.reduce((acc, opt) => acc + opt.price, 0)
                    return total + ((item.product.price + optionsPrice) * item.quantity)
                }, 0)
            }
        }),
        {
            name: 'restaurant-cart-storage',
        }
    )
)
