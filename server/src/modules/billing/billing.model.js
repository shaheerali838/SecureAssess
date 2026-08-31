import mongoose from "mongoose";
import {
  INVOICE_STATUS_LIST,
  INVOICE_STATUSES,
  WEBHOOK_EVENT_STATUS_LIST,
  WEBHOOK_EVENT_STATUSES,
  BILLING_PROVIDER_LIST,
  BILLING_PROVIDERS,
} from "./billing.constants.js";

// 1. Billing Customer Schema
const billingCustomerSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: BILLING_PROVIDER_LIST,
      default: BILLING_PROVIDERS.MOCK,
    },
    providerCustomerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const BillingCustomer =
  mongoose.models.BillingCustomer ||
  mongoose.model("BillingCustomer", billingCustomerSchema);

// 2. Invoice Record Schema
const invoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    provider: {
      type: String,
      enum: BILLING_PROVIDER_LIST,
      default: BILLING_PROVIDERS.MOCK,
    },
    providerCustomerId: {
      type: String,
      default: null,
      trim: true,
    },
    providerInvoiceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    providerPaymentId: {
      type: String,
      default: null,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: INVOICE_STATUS_LIST,
      default: INVOICE_STATUSES.PAID,
      index: true,
    },
    billingPeriodStart: {
      type: Date,
      default: null,
    },
    billingPeriodEnd: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    hostedInvoiceUrl: {
      type: String,
      default: null,
    },
    invoicePdfUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ organizationId: 1, createdAt: -1 });

export const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);

// 3. Webhook / Billing Event Schema
const billingEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: BILLING_PROVIDER_LIST,
      default: BILLING_PROVIDERS.MOCK,
    },
    eventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: WEBHOOK_EVENT_STATUS_LIST,
      default: WEBHOOK_EVENT_STATUSES.RECEIVED,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

billingEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const BillingEvent =
  mongoose.models.BillingEvent ||
  mongoose.model("BillingEvent", billingEventSchema);
