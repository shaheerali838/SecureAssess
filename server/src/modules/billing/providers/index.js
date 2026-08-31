import { MockBillingProvider } from "./mock.provider.js";

export const getBillingProvider = (providerName = "MOCK") => {
  switch (String(providerName).toUpperCase()) {
    case "MOCK":
    default:
      return new MockBillingProvider();
  }
};
