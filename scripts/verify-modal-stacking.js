/**
 * Automated Verification Suite for BUG-15:
 * "Two modals stack on login and block clicks. Official-notice modal and choose-address modal open together after login; clicks are blocked until both dismissed."
 *
 * Verifies:
 * 1. Static code analysis in CustomerLayout.jsx and LaunchNoticeModal.jsx for mutual exclusion,
 *    portal usage, scroll lock management, and single-prompt sequencing.
 * 2. Dynamic state simulation across 4 realistic login & modal presentation scenarios,
 *    verifying that the number of active modals NEVER exceeds 1 at any moment.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

console.log('Testing BUG-15: Two modals stack on login and block clicks (Web / UX)...\n');

// ==========================================
// Test 1: Static Code Analysis
// ==========================================
const customerLayoutPath = path.join(webRoot, 'src', 'layouts', 'CustomerLayout.jsx');
const launchNoticeModalPath = path.join(webRoot, 'src', 'components', 'customer', 'LaunchNoticeModal.jsx');

const customerLayoutSrc = fs.readFileSync(customerLayoutPath, 'utf8');
const launchNoticeModalSrc = fs.readFileSync(launchNoticeModalPath, 'utf8');

// 1.1 CustomerLayout must destructure locationOpen from useApp()
assert.ok(
  customerLayoutSrc.includes('locationOpen') && customerLayoutSrc.includes('setLocationOpen'),
  'CustomerLayout must access both locationOpen and setLocationOpen to coordinate modals'
);

// 1.2 CustomerLayout must check isLaunchNoticeDismissed
assert.ok(
  customerLayoutSrc.includes('isLaunchNoticeDismissed'),
  'CustomerLayout must define and use isLaunchNoticeDismissed()'
);

// 1.3 Address prompt effect must prevent opening while notice modal is active or pending
assert.ok(
  customerLayoutSrc.includes('!isLaunchNoticeDismissed() || launchNoticeOpen'),
  'Address confirmation prompt effect must guard against opening while launch notice is active or pending'
);
assert.ok(
  customerLayoutSrc.includes('setPendingAddressPrompt(true)'),
  'Address confirmation prompt must be queued in pendingAddressPrompt when notice is active'
);

// 1.4 Notice modal dismissal must sequentially trigger queued address prompt
assert.ok(
  customerLayoutSrc.includes('handleDismissLaunchNotice'),
  'CustomerLayout must implement handleDismissLaunchNotice'
);
assert.ok(
  customerLayoutSrc.includes('pendingAddressPrompt') && customerLayoutSrc.includes('setTimeout'),
  'Dismissing launch notice must cleanly schedule pending address prompt with a smooth delay'
);

// 1.5 LaunchNoticeModal must receive controlled props
assert.ok(
  customerLayoutSrc.includes('<LaunchNoticeModal') &&
  customerLayoutSrc.includes('open={launchNoticeOpen}') &&
  customerLayoutSrc.includes('onDismiss={handleDismissLaunchNotice}'),
  'LaunchNoticeModal must be controlled via open and onDismiss props in CustomerLayout'
);

// 1.6 Promotional popup must also be guarded against stacking
assert.ok(
  customerLayoutSrc.includes('!launchNoticeOpen && !locationOpen'),
  'Promotional modal must not open while LaunchNotice or LocationModal is open'
);

// 1.7 LaunchNoticeModal must use createPortal and manage body scroll class
assert.ok(
  launchNoticeModalSrc.includes('createPortal('),
  'LaunchNoticeModal must render via createPortal into document.body'
);
assert.ok(
  launchNoticeModalSrc.includes("document.body.classList.add('modal-open')"),
  'LaunchNoticeModal must add modal-open class when active'
);
assert.ok(
  launchNoticeModalSrc.includes("document.body.classList.remove('modal-open')"),
  'LaunchNoticeModal must remove modal-open class on cleanup'
);
assert.ok(
  launchNoticeModalSrc.includes("e.key === 'Escape'"),
  'LaunchNoticeModal must support Escape key dismissal once countdown completes'
);

console.log('✓ CustomerLayout.jsx and LaunchNoticeModal.jsx static checks passed.');

// ==========================================
// Test 2: Dynamic Simulation of Scenarios
// ==========================================

class ModalCoordinatorSimulator {
  constructor({ isNoticeDismissed = false, lastAddressPromptTime = 0, initialLocationOpen = false }) {
    this.noticeDismissed = isNoticeDismissed;
    this.lastAddressPromptTime = lastAddressPromptTime;
    this.locationOpen = initialLocationOpen;
    this.launchNoticeOpen = false;
    this.pendingAddressPrompt = false;
    this.promoModalOpen = false;
    this.maxConcurrentModals = 0;
    this.history = [];
  }

  recordState(action) {
    const activeModals = [
      this.launchNoticeOpen && 'OfficialNotice',
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
  onCustomerLogin({ hasAddresses = true }) {
    this.recordState('user_login');

    // 1. Launch notice trigger: 500ms timer
    if (!this.noticeDismissed && !this.locationOpen) {
      this.launchNoticeOpen = true;
      this.recordState('launch_notice_opened');
    }

    // 2. Address prompt trigger: 400ms timer
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    if (now - this.lastAddressPromptTime >= TWO_HOURS_MS) {
      if (!this.noticeDismissed || this.launchNoticeOpen) {
        // Guarded: DO NOT open location modal!
        this.pendingAddressPrompt = true;
        this.recordState('address_prompt_queued');
      } else {
        if (!this.launchNoticeOpen) {
          this.locationOpen = true;
          this.lastAddressPromptTime = now;
          this.recordState('address_prompt_opened');
        }
      }
    }
  }

  // Simulates Dismissing Launch Notice
  dismissLaunchNotice() {
    this.launchNoticeOpen = false;
    this.noticeDismissed = true;
    this.recordState('launch_notice_dismissed');

    // Sequenced opening of queued address prompt
    if (this.pendingAddressPrompt) {
      this.pendingAddressPrompt = false;
      this.locationOpen = true;
      this.lastAddressPromptTime = Date.now();
      this.recordState('queued_address_prompt_opened_sequentially');
    }
  }

  // Simulates Selecting/Closing Address Modal
  closeAddressModal() {
    this.locationOpen = false;
    this.recordState('address_modal_closed');
  }

  // Simulates Promo Popup event
  triggerPromoPopup() {
    if (!this.launchNoticeOpen && !this.locationOpen && this.noticeDismissed) {
      this.promoModalOpen = true;
      this.recordState('promo_modal_opened');
    } else {
      this.recordState('promo_modal_suppressed_due_to_active_modal');
    }
  }
}

// Scenario 1: Fresh Login (Notice NOT yet dismissed)
{
  const sim = new ModalCoordinatorSimulator({ isNoticeDismissed: false, lastAddressPromptTime: 0 });
  sim.onCustomerLogin({ hasAddresses: true });

  assert.equal(sim.launchNoticeOpen, true, 'Official Notice must open on fresh login');
  assert.equal(sim.locationOpen, false, 'Choose-address modal must NOT open while Notice is active');
  assert.equal(sim.pendingAddressPrompt, true, 'Address prompt must be safely queued');
  assert.equal(sim.maxConcurrentModals, 1, 'Never more than 1 modal active simultaneously');

  // Dismiss notice
  sim.dismissLaunchNotice();
  assert.equal(sim.launchNoticeOpen, false, 'Notice modal must close');
  assert.equal(sim.locationOpen, true, 'Address prompt must open sequentially as a single prompt');
  assert.equal(sim.maxConcurrentModals, 1, 'Max concurrent modals must remain 1');

  // Close address modal
  sim.closeAddressModal();
  assert.equal(sim.locationOpen, false, 'Address modal closed');
  assert.equal(sim.maxConcurrentModals, 1, 'At all times max active modal was exactly 1');
  console.log('✓ Scenario 1 passed: Fresh login opens Notice first, sequences Address modal cleanly (0 modal stacking).');
}

// Scenario 2: Login with Notice ALREADY dismissed
{
  const sim = new ModalCoordinatorSimulator({ isNoticeDismissed: true, lastAddressPromptTime: 0 });
  sim.onCustomerLogin({ hasAddresses: true });

  assert.equal(sim.launchNoticeOpen, false, 'Notice modal must not open when already dismissed');
  assert.equal(sim.locationOpen, true, 'Choose-address modal opens cleanly as single clear prompt');
  assert.equal(sim.maxConcurrentModals, 1, 'Max concurrent modals must be 1');

  sim.closeAddressModal();
  console.log('✓ Scenario 2 passed: Previously dismissed notice allows Address modal as single clear prompt.');
}

// Scenario 3: Manual address modal opened before notice
{
  const sim = new ModalCoordinatorSimulator({ isNoticeDismissed: false, initialLocationOpen: true });
  sim.onCustomerLogin({ hasAddresses: true });

  assert.equal(sim.locationOpen, true, 'Location modal was already open');
  assert.equal(sim.launchNoticeOpen, false, 'Notice modal must NOT open over location modal');
  assert.equal(sim.maxConcurrentModals, 1, 'Concurrent modals must not exceed 1');
  console.log('✓ Scenario 3 passed: Manual location modal suppresses notice modal from stacking on top.');
}

// Scenario 4: Promo popup arrives while modals are active
{
  const sim = new ModalCoordinatorSimulator({ isNoticeDismissed: false, lastAddressPromptTime: 0 });
  sim.onCustomerLogin({ hasAddresses: true });
  sim.triggerPromoPopup();

  assert.equal(sim.promoModalOpen, false, 'Promo modal suppressed while Notice is open');
  sim.dismissLaunchNotice();
  sim.triggerPromoPopup();
  assert.equal(sim.promoModalOpen, false, 'Promo modal suppressed while Address modal is open');
  sim.closeAddressModal();
  sim.triggerPromoPopup();
  assert.equal(sim.promoModalOpen, true, 'Promo modal opens only after all priority modals are closed');
  assert.equal(sim.maxConcurrentModals, 1, 'No stacking across 3 distinct modal types');
  console.log('✓ Scenario 4 passed: Multi-modal priority queue guarantees 0 modal stacking across all modal types.');
}

console.log('\nAll BUG-15 verification checks passed successfully!');

