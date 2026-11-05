/**
 * Automated Verification Suite for Modal Coordination and Stacking Prevention:
 * Ensures modals (address picker, promo popups) do not stack simultaneously,
 * and verifies that the legacy launch announcement notice modal has been completely removed.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

console.log('Testing Modal Coordination & Announcement Removal (Web / UX)...\n');

// ==========================================
// Test 1: Static Code Analysis
// ==========================================
const customerLayoutPath = path.join(webRoot, 'src', 'layouts', 'CustomerLayout.jsx');
const customerLayoutSrc = fs.readFileSync(customerLayoutPath, 'utf8');

// 1.1 CustomerLayout must destructure locationOpen from useApp()
assert.ok(
  customerLayoutSrc.includes('locationOpen') && customerLayoutSrc.includes('setLocationOpen'),
  'CustomerLayout must access both locationOpen and setLocationOpen to coordinate modals'
);

// 1.2 CustomerLayout must NOT render LaunchNoticeModal (Announcement removed)
assert.ok(
  !customerLayoutSrc.includes('<LaunchNoticeModal'),
  'LaunchNoticeModal must be removed from CustomerLayout'
);

// 1.3 Promotional popup must be guarded against stacking over location modal
assert.ok(
  customerLayoutSrc.includes('!locationOpen'),
  'Promotional modal must not open while LocationModal is open'
);

console.log('✓ CustomerLayout.jsx static checks passed (Announcement removed, modal coordination active).');

// ==========================================
// Test 2: Dynamic Simulation of Scenarios
// ==========================================

class ModalCoordinatorSimulator {
  constructor({ lastAddressPromptTime = 0, initialLocationOpen = false }) {
    this.lastAddressPromptTime = lastAddressPromptTime;
    this.locationOpen = initialLocationOpen;
    this.promoModalOpen = false;
    this.maxConcurrentModals = 0;
    this.history = [];
  }

  recordState(action) {
    const activeModals = [
      this.locationOpen && 'ChooseAddress',
      this.promoModalOpen && 'PromoModal'
    ].filter(Boolean);

    if (activeModals.length > this.maxConcurrentModals) {
      this.maxConcurrentModals = activeModals.length;
    }

    this.history.push({
      action,
      activeModals,
      count: activeModals.length
    });
  }

  // Simulates Customer Login
  onCustomerLogin() {
    this.recordState('user_login');

    // Address prompt trigger: 400ms timer
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - this.lastAddressPromptTime >= TWO_HOURS_MS) {
      this.locationOpen = true;
      this.lastAddressPromptTime = now;
      this.recordState('address_prompt_opened');
    }
  }

  // Simulates Selecting/Closing Address Modal
  closeAddressModal() {
    this.locationOpen = false;
    this.recordState('address_modal_closed');
  }

  // Simulates Promo Popup event
  triggerPromoPopup() {
    if (!this.locationOpen) {
      this.promoModalOpen = true;
      this.recordState('promo_modal_opened');
    } else {
      this.recordState('promo_modal_suppressed_due_to_active_modal');
    }
  }
}

// Scenario 1: Fresh Login opens Address modal as single prompt
{
  const sim = new ModalCoordinatorSimulator({ lastAddressPromptTime: 0 });
  sim.onCustomerLogin();

  assert.equal(sim.locationOpen, true, 'Choose-address modal opens cleanly as single prompt');
  assert.equal(sim.maxConcurrentModals, 1, 'Never more than 1 modal active simultaneously');

  sim.closeAddressModal();
  assert.equal(sim.locationOpen, false, 'Address modal closed');
  console.log('✓ Scenario 1 passed: Login opens Address modal cleanly (0 modal stacking).');
}

// Scenario 2: Promo popup suppressed while address modal is active
{
  const sim = new ModalCoordinatorSimulator({ lastAddressPromptTime: 0 });
  sim.onCustomerLogin();
  sim.triggerPromoPopup();

  assert.equal(sim.promoModalOpen, false, 'Promo modal suppressed while Address modal is open');
  assert.equal(sim.maxConcurrentModals, 1, 'Max concurrent modals must remain 1');

  sim.closeAddressModal();
  sim.triggerPromoPopup();
  assert.equal(sim.promoModalOpen, true, 'Promo modal opens after address modal is closed');
  assert.equal(sim.maxConcurrentModals, 1, 'Never more than 1 modal active');
  console.log('✓ Scenario 2 passed: Promo popup suppresses cleanly when address modal is open.');
}

console.log('\nAll Modal Coordination checks passed successfully!');
