// Script to clear cart storage
if (typeof window !== 'undefined') {
  localStorage.removeItem('cart-storage');
  console.log('Cart storage cleared');
}