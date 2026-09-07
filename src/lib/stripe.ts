import Stripe from "stripe";
import config from "../config";

let _stripe: Stripe | null = null;

const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!config.stripe.secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured");
      }
      _stripe = new Stripe(config.stripe.secretKey);
    }
    const value = (_stripe as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(_stripe) : value;
  },
});

export default stripe;
