import React, { useRef, useState } from 'react';
import { Printer, FileText, Receipt, X, Check, Download, AlertCircle } from 'lucide-react';
import { Button, money } from '../ui';
import { BRAND } from '../../config/brand';

function numberToWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.floor(Math.abs(Number(num) || 0));
  if (n === 0) return 'Zero Rupees Only';

  function convertGroup(n) {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
    return a[Math.floor(n / 100)] + ' Hundred ' + convertGroup(n % 100);
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  if (crore > 0) words += convertGroup(crore) + 'Crore ';
  if (lakh > 0) words += convertGroup(lakh) + 'Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + 'Thousand ';
  if (hundred > 0) words += convertGroup(hundred);

  return words.trim() + ' Rupees Only';
}

export function OrderPrintModal({ open, onClose, order, storeSettings }) {
  const [printMode, setPrintMode] = useState('thermal'); // 'thermal' | 'a4'

  if (!open || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const legalEntity = storeSettings?.policies?.legalName || 'R2Cart Retail Private Limited';
  const storePhone = storeSettings?.contactNumber || storeSettings?.policies?.supportPhone || '+91 80000 10001';
  const storeEmail = storeSettings?.email || storeSettings?.policies?.supportEmail || 'support@r2cart.in';
  const storeAddress = storeSettings?.address || storeSettings?.policies?.officeAddress || 'Bailey Road, Patna, Bihar — 800001';
  const gstin = storeSettings?.policies?.gstin || '10AAAAA0000A1Z5';
  const fssai = storeSettings?.policies?.fssai || '10424000000123';

  const orderDate = new Date(order.date || order.createdAt || Date.now()).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const address = order.addressSnapshot || {};
  const isScheduled = order.deliveryType === 'SCHEDULED';
  const totalUnits = (order.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
  const totalItemsCount = (order.items || []).length;

  return (
    <div className="order-print-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="order-print-container">
        {/* Top Control Bar */}
        <div className="order-print-toolbar no-print">
          <div className="print-toolbar-left">
            <div className="print-mode-tabs">
              <button
                type="button"
                className={`print-tab-btn ${printMode === 'thermal' ? 'active' : ''}`}
                onClick={() => setPrintMode('thermal')}
              >
                <Receipt size={16} />
                <span>80mm Thermal Slip (POS)</span>
              </button>
              <button
                type="button"
                className={`print-tab-btn ${printMode === 'a4' ? 'active' : ''}`}
                onClick={() => setPrintMode('a4')}
              >
                <FileText size={16} />
                <span>A4 Legal Tax Invoice</span>
              </button>
            </div>
            <span className="print-info-badge">
              Order #{order.orderNumber} · {isScheduled ? `📅 Scheduled` : `⚡ Instant`}
            </span>
          </div>

          <div className="print-toolbar-right">
            <Button variant="primary" onClick={handlePrint} className="print-action-btn">
              <Printer size={16} />
              <span>Print {printMode === 'thermal' ? 'Slip (80mm)' : 'Invoice (A4)'}</span>
            </Button>
            <button type="button" className="print-close-btn" onClick={onClose} aria-label="Close preview">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Wrapper */}
        <div className="order-print-preview-viewport">
          <div id="order-printable-content" className={`order-printable-content mode-${printMode}`}>

            {/* ============================================================== */}
            {/* 1. 80mm THERMAL PACKING SLIP & KOT LAYOUT                      */}
            {/* ============================================================== */}
            {printMode === 'thermal' && (
              <div className="thermal-slip-view">
                {/* Brand Header */}
                <div className="thermal-header">
                  <h2 className="thermal-brand-name">{BRAND.name.toUpperCase()}</h2>
                  <div className="thermal-brand-sub">DARK STORE FULFILMENT HUB #1</div>
                  <div className="thermal-store-contact">Ph: {storePhone}</div>
                  <div className="thermal-divider-double" />
                </div>

                {/* Big Order Number & Mode Banner */}
                <div className="thermal-order-badge">
                  <div className="thermal-order-id">ORD #{order.orderNumber}</div>
                  <div className={`thermal-mode-pill ${isScheduled ? 'scheduled' : 'instant'}`}>
                    {isScheduled ? `📅 SCHEDULED DELIVERY` : `⚡ INSTANT 15-MIN EXPRESS`}
                  </div>
                  {isScheduled && (
                    <div className="thermal-schedule-slot">
                      Slot: <b>{order.deliveryDate}</b> ({order.deliverySlot})
                    </div>
                  )}
                </div>

                <div className="thermal-divider-dashed" />

                {/* Customer & Delivery Landmark */}
                <div className="thermal-customer-box">
                  <div className="thermal-row">
                    <span className="thermal-lbl">Customer:</span>
                    <span className="thermal-val font-bold">{order.customer || address.name || 'Valued Customer'}</span>
                  </div>
                  <div className="thermal-row">
                    <span className="thermal-lbl">Mobile:</span>
                    <span className="thermal-val font-bold">{order.mobile || address.mobile || '—'}</span>
                  </div>
                  <div className="thermal-address-block">
                    <span className="thermal-lbl">Address:</span>
                    <div className="thermal-addr-text">
                      {address.house ? `${address.house}, ` : ''}
                      {address.street ? `${address.street}, ` : ''}
                      {address.landmark ? <b className="thermal-landmark">Landmark: {address.landmark}, </b> : ''}
                      {address.area || 'Hathua'}, {address.city || 'Gopalganj'} {address.pin ? `- ${address.pin}` : ''}
                    </div>
                  </div>
                  {order.deliveryInstruction && (
                    <div className="thermal-instruction-box">
                      🔔 <b>NOTE:</b> {order.deliveryInstruction}
                    </div>
                  )}
                </div>

                <div className="thermal-divider-double" />

                {/* Items Checklist Table */}
                <div className="thermal-items-header">
                  <span>PACKING CHECKLIST</span>
                  <span>QTY</span>
                </div>
                <div className="thermal-items-list">
                  {(order.items || []).map((item, idx) => (
                    <div className="thermal-item-row" key={item.id || idx}>
                      <div className="thermal-item-check">
                        <span className="thermal-checkbox">[ ]</span>
                        <div className="thermal-item-meta">
                          <span className="thermal-item-name">{item.name}</span>
                          <span className="thermal-item-unit">{item.unit} {item.sku ? `· ${item.sku}` : ''}</span>
                        </div>
                      </div>
                      <div className="thermal-item-qty">
                        <b>x{item.quantity}</b>
                        <span className="thermal-item-price">₹{Number(item.price) * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="thermal-divider-dashed" />

                {/* Total Units Count */}
                <div className="thermal-row thermal-units-summary">
                  <span>Total Items: <b>{totalItemsCount}</b></span>
                  <span>Total Units: <b>{totalUnits}</b></span>
                </div>

                <div className="thermal-divider-dashed" />

                {/* Financial Summary */}
                <div className="thermal-bill-breakdown">
                  <div className="thermal-row">
                    <span>Items Total (MRP)</span>
                    <span>₹{Number(order.itemTotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(order.productDiscount || 0) > 0 && (
                    <div className="thermal-row discount">
                      <span>Product Savings</span>
                      <span>-₹{Number(order.productDiscount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order.couponDiscount || 0) > 0 && (
                    <div className="thermal-row discount">
                      <span>Coupon Discount</span>
                      <span>-₹{Number(order.couponDiscount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="thermal-row">
                    <span>Delivery Charges</span>
                    <span>{Number(order.deliveryFee || 0) === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(2)}`}</span>
                  </div>
                  <div className="thermal-divider-solid" />
                  <div className="thermal-row thermal-grand-total">
                    <span>COLLECT / TOTAL:</span>
                    <span>₹{Number(order.total || order.grandTotal || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="thermal-divider-double" />

                {/* Payment Status Bar */}
                <div className={`thermal-payment-bar ${order.paymentMethod === 'COD' ? 'cod' : 'paid'}`}>
                  {order.paymentMethod === 'COD' ? (
                    <div className="thermal-pay-text">
                      ⚠️ <b>CASH ON DELIVERY (COD)</b>
                      <span>COLLECT ₹{Number(order.total || order.grandTotal || 0).toFixed(0)} AT DOORSTEP</span>
                    </div>
                  ) : (
                    <div className="thermal-pay-text">
                      ✓ <b>PAID ONLINE ({order.paymentMethod || 'PREPAID'})</b>
                      <span>DO NOT COLLECT PAYMENT</span>
                    </div>
                  )}
                </div>

                {/* Sign-off & Handover verification */}
                <div className="thermal-signoff-grid">
                  <div className="thermal-sign-field">
                    <span>Picked by:</span>
                    <div className="thermal-sign-line" />
                  </div>
                  <div className="thermal-sign-field">
                    <span>Packed by:</span>
                    <div className="thermal-sign-line" />
                  </div>
                  <div className="thermal-sign-field">
                    <span>Handed to Rider:</span>
                    <div className="thermal-sign-line" />
                  </div>
                </div>

                {/* Timestamp & Footer */}
                <div className="thermal-footer">
                  <div>Placed: {orderDate}</div>
                  <div>Printed: {printTimestamp}</div>
                  <div className="thermal-slogan">*** 100% Quality & Freshness Guarantee ***</div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* 2. A4 LEGAL TAX INVOICE LAYOUT (GST COMPLIANT)                 */}
            {/* ============================================================== */}
            {printMode === 'a4' && (
              <div className="a4-invoice-sheet">
                {/* Invoice Top Header */}
                <div className="a4-invoice-head">
                  <div className="a4-brand-col">
                    <h1 className="a4-brand-title">{BRAND.name}</h1>
                    <div className="a4-company-name">{legalEntity}</div>
                    <div className="a4-store-address">{storeAddress}</div>
                    <div className="a4-store-meta">
                      <span>Email: {storeEmail}</span> · <span>Phone: {storePhone}</span>
                    </div>
                    <div className="a4-tax-ids">
                      <b>GSTIN:</b> {gstin} | <b>FSSAI Lic No:</b> {fssai}
                    </div>
                  </div>

                  <div className="a4-invoice-meta-col">
                    <div className="a4-doc-type">TAX INVOICE / CASH BILL</div>
                    <div className="a4-meta-grid">
                      <div className="a4-meta-cell">
                        <span className="lbl">Invoice No:</span>
                        <b className="val">INV-{order.orderNumber}</b>
                      </div>
                      <div className="a4-meta-cell">
                        <span className="lbl">Invoice Date:</span>
                        <b className="val">{orderDate}</b>
                      </div>
                      <div className="a4-meta-cell">
                        <span className="lbl">Order ID:</span>
                        <b className="val">#{order.orderNumber}</b>
                      </div>
                      <div className="a4-meta-cell">
                        <span className="lbl">Delivery Mode:</span>
                        <b className="val">{isScheduled ? `Scheduled (${order.deliverySlot})` : 'Express (Instant)'}</b>
                      </div>
                      <div className="a4-meta-cell">
                        <span className="lbl">Place of Supply:</span>
                        <b className="val">Bihar (Code: 10)</b>
                      </div>
                      <div className="a4-meta-cell">
                        <span className="lbl">Reverse Charge:</span>
                        <b className="val">No</b>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="a4-divider" />

                {/* Parties Details (Billed to / Shipped to) */}
                <div className="a4-parties-grid">
                  <div className="a4-party-box">
                    <div className="a4-box-title">BILLED TO / CUSTOMER DETAILS</div>
                    <div className="a4-party-name"><b>{order.customer || address.name || 'Valued Customer'}</b></div>
                    <div className="a4-party-row">Phone: <b>{order.mobile || address.mobile || '—'}</b></div>
                    {order.user?.email && <div className="a4-party-row">Email: {order.user.email}</div>}
                    <div className="a4-party-row">Customer ID: {order.user?.id || 'GUEST-USER'}</div>
                  </div>

                  <div className="a4-party-box">
                    <div className="a4-box-title">SHIPPED TO (DELIVERY ADDRESS)</div>
                    <div className="a4-addr-details">
                      {address.house && <div>House/Flat: {address.house}</div>}
                      {address.street && <div>Street/Colony: {address.street}</div>}
                      {address.landmark && <div><b>Landmark:</b> {address.landmark}</div>}
                      <div>Area / Locality: <b>{address.area || 'Hathua'}</b>, {address.city || 'Gopalganj'}</div>
                      <div>State: Bihar {address.pin ? `— PIN: ${address.pin}` : ''}</div>
                      {order.deliveryInstruction && (
                        <div className="a4-delivery-instruction">
                          <b>Delivery Instruction:</b> {order.deliveryInstruction}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className="a4-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '42%' }}>Item Description</th>
                      <th style={{ width: '13%' }}>Pack Size / SKU</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>MRP (₹)</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Unit Rate (₹)</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, idx) => {
                      const mrp = Number(item.mrp || item.price);
                      const unitPrice = Number(item.price);
                      const lineTotal = unitPrice * item.quantity;
                      return (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="a4-item-title">{item.name}</div>
                          </td>
                          <td>{item.unit} {item.sku ? <small className="a4-sku">({item.sku})</small> : ''}</td>
                          <td style={{ textAlign: 'center' }}><b>{item.quantity}</b></td>
                          <td style={{ textAlign: 'right' }}>₹{mrp.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>₹{unitPrice.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}><b>₹{lineTotal.toFixed(2)}</b></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Financial Summary & Amount in Words */}
                <div className="a4-bottom-grid">
                  <div className="a4-bottom-left">
                    <div className="a4-amount-words-box">
                      <span className="lbl">Amount in Words:</span>
                      <b className="val">{numberToWords(order.total || order.grandTotal)}</b>
                    </div>

                    <div className="a4-payment-box">
                      <span className="lbl">Payment Details:</span>
                      <div className="val">
                        <b>Mode:</b> {order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                        <br />
                        <b>Payment Status:</b> {order.paymentStatus || 'PENDING'}
                        <br />
                        <b>Amount to Collect:</b> {order.paymentMethod === 'COD' ? `₹${Number(order.total || order.grandTotal).toFixed(2)}` : '₹0.00 (PREPAID)'}
                      </div>
                    </div>

                    <div className="a4-terms-box">
                      <b>Terms & Conditions:</b>
                      <ol>
                        <li>All perishable goods must be inspected at the time of doorstep handover.</li>
                        <li>Returns and refunds are processed per R2Cart standard return policy.</li>
                        <li>This is a system generated tax invoice issued by {legalEntity}.</li>
                      </ol>
                    </div>
                  </div>

                  <div className="a4-bottom-right">
                    <div className="a4-totals-table">
                      <div className="a4-total-row">
                        <span>Items Total (at MRP)</span>
                        <b>₹{Number(order.itemTotal || 0).toFixed(2)}</b>
                      </div>
                      {Number(order.productDiscount || 0) > 0 && (
                        <div className="a4-total-row savings">
                          <span>Product Discounts</span>
                          <b>-₹{Number(order.productDiscount).toFixed(2)}</b>
                        </div>
                      )}
                      {Number(order.couponDiscount || 0) > 0 && (
                        <div className="a4-total-row savings">
                          <span>Coupon Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</span>
                          <b>-₹{Number(order.couponDiscount).toFixed(2)}</b>
                        </div>
                      )}
                      <div className="a4-total-row">
                        <span>Delivery & Packaging Fee</span>
                        <b>{Number(order.deliveryFee || 0) === 0 ? 'FREE' : `₹${Number(order.deliveryFee).toFixed(2)}`}</b>
                      </div>
                      <div className="a4-grand-row">
                        <span>Grand Total (INR):</span>
                        <b>₹{Number(order.total || order.grandTotal || 0).toFixed(2)}</b>
                      </div>
                      <div className="a4-tax-note">
                        (Inclusive of all applicable Goods & Services Tax)
                      </div>
                    </div>

                    <div className="a4-signatory-box">
                      <div className="a4-sign-line" />
                      <b>Authorized Signatory</b>
                      <span>For {legalEntity}</span>
                    </div>
                  </div>
                </div>

                <div className="a4-invoice-footer">
                  <span>Registered Office: {storeAddress} · GSTIN: {gstin}</span>
                  <span>Page 1 of 1 · Generated on {printTimestamp}</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
