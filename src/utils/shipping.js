/**
 * Calculates extra product-level shipping fees based on quantity,
 * solo cart rules, and minimum other items cart value thresholds.
 */
export function calculateExtraShippingFees(cartItems, subtotal) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
  let extraFees = 0;

  for (const itm of cartItems) {
    const product = itm.product || itm;
    const feePerUnit = Math.max(0, Number(product?.shippingFee) || 0);
    if (feePerUnit <= 0) continue;

    const qty = Math.max(1, parseInt(itm.qty || itm.quantity, 10) || 1);
    const soloOnly = Boolean(product?.shippingSoloOnly);
    const minOtherCartValue = Math.max(0, Number(product?.shippingMinOtherCartValue) || 0);

    if (soloOnly) {
      const isSolo = cartItems.length === 1;
      if (isSolo) {
        extraFees += feePerUnit * qty;
      } else {
        const itemLineTotal = Number(product?.price || 0) * qty;
        const otherItemsSubtotal = Math.max(0, Number(subtotal || 0) - itemLineTotal);
        if (minOtherCartValue > 0 && otherItemsSubtotal < minOtherCartValue) {
          extraFees += feePerUnit * qty;
        }
      }
    } else {
      extraFees += feePerUnit * qty;
    }
  }

  return extraFees;
}
