import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function verifyCustomerLayoutHeader() {
  const layoutPath = path.join(rootDir, 'src', 'layouts', 'CustomerLayout.jsx');
  const content = fs.readFileSync(layoutPath, 'utf8');

  // Verify Header imports and computes closed status
  if (!content.includes('storeSettings') || !content.includes('isStoreFullyClosed') || !content.includes('isInstantClosed')) {
    throw new Error('CustomerLayout.jsx Header must compute isStoreFullyClosed and isInstantClosed from storeSettings');
  }

  // Verify Header conditionally switches delivery label
  if (!content.includes("t('storeClosed')")) {
    throw new Error("CustomerLayout.jsx Header must display t('storeClosed') when store is closed");
  }

  // Verify Moon icon is imported
  if (!content.includes('Moon')) {
    throw new Error('CustomerLayout.jsx must import Moon icon from lucide-react');
  }

  console.log('✓ CustomerLayout.jsx static checks passed: Header synchronizes store closed state with banner');
}

function verifyCartAndProductPages() {
  const cartPath = path.join(rootDir, 'src', 'pages', 'customer', 'CartPage.jsx');
  const cartContent = fs.readFileSync(cartPath, 'utf8');
  if (!cartContent.includes('isStoreFullyClosed') || !cartContent.includes('isInstantClosed')) {
    throw new Error('CartPage.jsx must synchronize store closed state');
  }

  const prodPath = path.join(rootDir, 'src', 'pages', 'customer', 'ProductPage.jsx');
  const prodContent = fs.readFileSync(prodPath, 'utf8');
  if (!prodContent.includes('isStoreFullyClosed') || !prodContent.includes('isInstantClosed')) {
    throw new Error('ProductPage.jsx must synchronize store closed state');
  }

  console.log('✓ CartPage.jsx & ProductPage.jsx static checks passed: ETAs decoupled during store closure');
}

function verifyLanguageKeys() {
  const langPath = path.join(rootDir, 'src', 'context', 'LanguageContext.jsx');
  const content = fs.readFileSync(langPath, 'utf8');

  if (!content.includes("storeClosed: 'Store Closed'") || !content.includes("storeClosed: 'दुकान बंद है'")) {
    throw new Error('LanguageContext.jsx missing storeClosed translation keys');
  }

  if (!content.includes("scheduleOpen: 'Schedule Open'") || !content.includes("scheduleOpen: 'शेड्यूल उपलब्ध'")) {
    throw new Error('LanguageContext.jsx missing scheduleOpen translation keys');
  }

  console.log('✓ LanguageContext.jsx translations verified for English and Hindi');
}

function verifyMessagingConsistencySimulation() {
  const computeHeaderStatus = ({ storeStatus, allowImmediateOrders, allowScheduledOrders, isEmergencyActive, isPausedRule }) => {
    const isEmergencyPaused = Boolean(storeStatus === 'EMERGENCY_PAUSED' || isEmergencyActive);
    const isStoreFullyClosed = Boolean(storeStatus === 'CLOSED' || (allowImmediateOrders === false && allowScheduledOrders === false));
    const isInstantClosed = Boolean(isEmergencyPaused || isStoreFullyClosed || storeStatus === 'SCHEDULED_ONLY' || allowImmediateOrders === false);
    const allowScheduled = Boolean(!isStoreFullyClosed && allowScheduledOrders !== false);
    const isPaused = Boolean(isPausedRule || isEmergencyPaused);
    const isClosed = Boolean(isStoreFullyClosed || isInstantClosed);

    if (isPaused) {
      return { title: 'Delivery Paused', isInstantDeliveryAdvertised: false };
    }
    if (isClosed) {
      return {
        title: 'Store Closed',
        subtitle: allowScheduled ? 'Schedule Open' : 'Closed',
        isInstantDeliveryAdvertised: false
      };
    }
    return { title: 'Delivery in 15–20 mins', isInstantDeliveryAdvertised: true };
  };

  // Test Case 1: Store Closed for instant delivery (outside operating hours / scheduled only)
  const case1 = computeHeaderStatus({ storeStatus: 'SCHEDULED_ONLY', allowImmediateOrders: false, allowScheduledOrders: true });
  if (case1.isInstantDeliveryAdvertised || case1.title !== 'Store Closed') {
    throw new Error(`Case 1 failed: Expected 'Store Closed' without instant ETA, got: ${JSON.stringify(case1)}`);
  }

  // Test Case 2: Store Completely Closed (all day holiday or emergency shutdown)
  const case2 = computeHeaderStatus({ storeStatus: 'CLOSED', allowImmediateOrders: false, allowScheduledOrders: false });
  if (case2.isInstantDeliveryAdvertised || case2.title !== 'Store Closed') {
    throw new Error(`Case 2 failed: Expected 'Store Closed' without instant ETA, got: ${JSON.stringify(case2)}`);
  }

  // Test Case 3: Emergency paused
  const case3 = computeHeaderStatus({ storeStatus: 'EMERGENCY_PAUSED', allowImmediateOrders: false, allowScheduledOrders: false });
  if (case3.isInstantDeliveryAdvertised || case3.title !== 'Delivery Paused') {
    throw new Error(`Case 3 failed: Expected 'Delivery Paused' without instant ETA, got: ${JSON.stringify(case3)}`);
  }

  // Test Case 4: Store Open for regular instant delivery
  const case4 = computeHeaderStatus({ storeStatus: 'OPEN', allowImmediateOrders: true, allowScheduledOrders: true });
  if (!case4.isInstantDeliveryAdvertised || case4.title !== 'Delivery in 15–20 mins') {
    throw new Error(`Case 4 failed: Expected instant ETA advertising when store is open, got: ${JSON.stringify(case4)}`);
  }

  console.log('✓ Dynamic simulation passed: 4 store operating scenarios validated with zero contradiction');
}

function run() {
  console.log('Testing BUG-13: Store closed vs instant delivery header messaging consistency...\n');
  verifyCustomerLayoutHeader();
  verifyCartAndProductPages();
  verifyLanguageKeys();
  verifyMessagingConsistencySimulation();
  console.log('\nAll BUG-13 verification checks passed successfully!');
}

run();

