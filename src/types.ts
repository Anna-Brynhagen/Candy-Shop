export interface Item {
  id: number
  name: string
  description: string
  price: number
  images: {
    thumbnail: string
    large: string
  }
  stock_status: string
  stock_quantity: number
  quantity?: number
}

export interface Order {
    customer_first_name: string
    customer_last_name: string
    customer_address: string
    customer_postcode: string
    customer_city: string
    customer_email: string
    customer_phone: string
    order_total: number
    order_items: ItemsCart[] 
}

export interface ItemsCart {
    product_id: number
    qty: number
    item_price: number
    item_total: number
    name: string
}

export interface OrderRes {
    id: number
}