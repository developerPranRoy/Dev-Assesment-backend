import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.secretKey || "");

export default stripe;