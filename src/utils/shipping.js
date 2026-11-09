/**
 * Calculates extra product-level shipping fees based on quantity,
 * village targeting, and minimum other items cart value thresholds.
 */
export function calculateExtraShippingFees(cartItems, subtotal, activeLocation) {
  const breakdown = getCartShippingBreakdown(cartItems, subtotal, activeLocation);
  return breakdown.extraFees;
}

/**
 * Provides a detailed breakdown of item-level delivery surcharges and
 * suggestions on how much more to add to waive the fee.
 */
export function getCartShippingBreakdown(cartItems, subtotal, activeLocation) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { extraFees: 0, itemSurcharges: [], waiveSuggestions: [] };
  }

  let extraFees = 0;
  const itemSurcharges = [];
  const waiveSuggestions = [];

  // Extract possible location identifiers (villageId, villageName, zoneId, zoneName, area, name)
  const locId = typeof activeLocation === 'object'
    ? String(activeLocation?.villageId || activeLocation?.id || activeLocation?.zoneId || '').trim().toLowerCase()
    : '';
  const locName = typeof activeLocation === 'object'
    ? String(activeLocation?.villageName || activeLocation?.name || activeLocation?.area || '').trim().toLowerCase()
    : String(activeLocation || '').trim().toLowerCase();

  for (const itm of cartItems) {
    const product = itm.product || itm;
    const feePerUnit = Math.max(0, Number(product?.shippingFee) || 0);
    if (feePerUnit <= 0) continue;

    // Check village / locality targeting if configured on the product
    const rawVillages = Array.isArray(product?.shippingVillages)
      ? product.shippingVillages
      : (typeof product?.shippingVillages === 'string' && product.shippingVillages.trim()
          ? product.shippingVillages.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    if (rawVillages.length > 0 && (locId || locName)) {
      const isMatch = rawVillages.some(target => {
        const t = String(target || '').trim().toLowerCase();
        return t && (t === locId || t === locName);
      });
      if (!isMatch) {
        continue; // Does not apply to user's selected village
      }
    }

    const qty = Math.max(1, parseInt(itm.qty || itm.quantity, 10) || 1);
    const soloOnly = Boolean(product?.shippingSoloOnly);
    const minOtherCartValue = Math.max(0, Number(product?.shippingMinOtherCartValue) || 0);
    const itemLineTotal = Number(product?.price || 0) * qty;
    const otherItemsSubtotal = Math.max(0, Number(subtotal || 0) - itemLineTotal);

    let feeApplied = 0;
    if (minOtherCartValue > 0) {
      if (otherItemsSubtotal < minOtherCartValue) {
        feeApplied = feePerUnit * qty;
        const diff = Math.max(1, Math.ceil(minOtherCartValue - otherItemsSubtotal));
        waiveSuggestions.push({
          productId: product.id,
          productName: product.name,
          amountNeeded: diff,
          currentOther: otherItemsSubtotal,
          minRequired: minOtherCartValue,
          feeToSave: feeApplied
        });
      }
    } else if (soloOnly) {
      const isSolo = cartItems.length === 1 || otherItemsSubtotal === 0;
      if (isSolo) {
        feeApplied = feePerUnit * qty;
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
        minOtherCartValue,
        shippingVillages: rawVillages
      });
    }
  }

  return { extraFees, itemSurcharges, waiveSuggestions };
}
