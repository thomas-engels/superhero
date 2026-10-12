// Checkout routing: decides where each payment button sends the customer.
// Kept free of DOM access so it can be unit-tested — see tests/checkout-routing.test.html.

const VENMO_RECIPIENT = 'superhero_first_aid_systems';
const PAYPAL_ME_URL   = 'https://www.paypal.me/tbengels97/';

// Phones and tablets get the Venmo app deep link; everything else gets venmo.com.
function isMobileUA(userAgent) {
  return /Android|iPhone|iPad|iPod/i.test(userAgent);
}

function venmoCheckoutPlan(grandTotal, noteText, userAgent) {
  const query  = 'recipients=' + VENMO_RECIPIENT + '&amount=' + grandTotal + '&note=' + encodeURIComponent(noteText);
  const webUrl = 'https://account.venmo.com/pay?' + query;
  const plan   = { store: { venmoWebUrl: webUrl } };
  if (isMobileUA(userAgent)) {
    // Open the Venmo app, then move this tab to the thank-you page.
    plan.navigate     = 'venmo://paycharge?txn=pay&' + query;
    plan.thenNavigate = 'thank-you.html';
    plan.delayMs      = 500;
  } else {
    plan.openTab  = webUrl;
    plan.navigate = 'thank-you.html';
  }
  return plan;
}

// PayPal.me has no note parameter, so the order details go on the clipboard for the customer to paste.
function paypalCheckoutPlan(grandTotal, noteText) {
  return { copy: noteText, openTab: PAYPAL_ME_URL + grandTotal };
}

function runCheckoutPlan(plan, env) {
  if (plan.store) for (const key in plan.store) env.store(key, plan.store[key]);
  if (plan.copy) env.copy(plan.copy);
  if (plan.openTab) env.openTab(plan.openTab);
  if (plan.navigate) env.navigate(plan.navigate);
  if (plan.thenNavigate) env.later(() => env.navigate(plan.thenNavigate), plan.delayMs);
}

const browserCheckoutEnv = {
  store:    (key, value) => sessionStorage.setItem(key, value),
  copy:     text => navigator.clipboard.writeText(text).catch(() => {}),
  openTab:  url => window.open(url, '_blank'),
  navigate: url => { window.location.href = url; },
  later:    (fn, ms) => setTimeout(fn, ms),
};
