/**
 * Calculates extra product-level shipping fees based on quantity,
 * solo cart rules, and minimum other items cart value thresholds.
 */
export function calculateExtraShippingFees(cartItems, subtotal) {
  const breakdown = getCartShippingBreakdown(cartItems, subtotal);
  return breakdown.extraFees;
}

/**
 * Provides a detailed breakdown of item-level delivery surcharges and
 * suggestions on how much more to add to waive the fee.
 */
export function getCartShippingBreakdown(cartItems, subtotal) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { extraFees: 0, itemSurcharges: [], waiveSuggestions: [] };
  }

  let extraFees = 0;
  const itemSurcharges = [];
  const waiveSuggestions = [];

  for (const itm of cartItems) {
    const product = itm.product || itm;
    const feePerUnit = Math.max(0, Number(product?.shippingFee) || 0);
    if (feePerUnit <= 0) continue;

    const qty = Math.max(1, parseInt(itm.qty || itm.quantity, 10) || 1);
    const soloOnly = Boolean(product?.shippingSoloOnly);
    const minOtherCartValue = Math.max(0, Number(product?.shippingMinOtherCartValue) || 0);
    const itemLineTotal = Number(product?.price || 0) * qty;
    const otherItemsSubtotal = Math.max(0, Number(subtotal || 0) - itemLineTotal);

    let feeApplied = 0;
    if (soloOnly) {
      const isSolo = cartItems.length === 1;
      if (isSolo) {
        feeApplied = feePerUnit * qty;
        if (minOtherCartValue > 0) {
          waiveSuggestions.push({
            productId: product.id,
            productName: product.name,
            amountNeeded: Math.max(1, Math.ceil(minOtherCartValue)),
            currentOther: 0,
            feeToSave: feeApplied
          });
        }
      } else {
        if (minOtherCartValue > 0 && otherItemsSubtotal < minOtherCartValue) {
          feeApplied = feePerUnit * qty;
          const diff = Math.max(1, Math.ceil(minOtherCartValue - otherItemsSubtotal));
          waiveSuggestions.push({
            productId: product.id,
            productName: product.name,
            amountNeeded: diff,
            currentOther: otherItemsSubtotal,
            feeToSave: feeApplied
          });
        }
      }
    } else {
      feeApplied = feePerUnit * qty;
    }

    if (feeApplied > 0) {
      extraFees += feeApplied;
      itemSurcharges.push({
        id: product.id,
        name: product.name,
        qty,
        feePerUnit,
        totalFee: feeApplied,
        soloOnly,
        minOtherCartValue
      });
    }
  }

  return { extraFees, itemSurcharges, waiveSuggestions };
}


