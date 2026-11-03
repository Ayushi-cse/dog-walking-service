/**
 * Dog Walking Service - Network Simulation Module
 * Simulates bad connectivity / slow 3G conditions
 * 
 * Satisfies TRD Unhappy Path: "Assume the user might be on a slow 3G connection.
 * Ensure there is a visual loading indicator during any asynchronous operations."
 */

let isSlow3GEnabled = false;
const SLOW_3G_LATENCY_MS = 1400;
const FAST_LATENCY_MS = 180;

/**
 * Toggles or sets the simulated 3G connection mode.
 * @param {boolean} [enable] 
 * @returns {boolean} New slow 3G state
 */
export function toggleSlow3G(enable) {
  if (typeof enable === 'boolean') {
    isSlow3GEnabled = enable;
  } else {
    isSlow3GEnabled = !isSlow3GEnabled;
  }
  return isSlow3GEnabled;
}

/**
 * Returns whether slow 3G simulation is active.
 * @returns {boolean}
 */
export function getSlow3GState() {
  return isSlow3GEnabled;
}

/**
 * Simulates an asynchronous server dispatch over network.
 * @param {number} [customDelay]
 * @returns {Promise<void>}
 */
export function simulateNetworkDelay(customDelay) {
  const delay = customDelay !== undefined
    ? customDelay
    : (isSlow3GEnabled ? SLOW_3G_LATENCY_MS : FAST_LATENCY_MS);

  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}
