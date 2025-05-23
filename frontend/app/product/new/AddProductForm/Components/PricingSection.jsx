"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Repeat,
  Tag,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Check,
  Calendar,
  CreditCard
} from "lucide-react";

const PricingSection = ({
  pricing,
  setPricing,
  onBack,
  onNext,
  error,
}) => {
  const pricingTypes = [
    { id: "free", icon: Check, label: "Free", description: "Your product is available for free" },
    { id: "paid", icon: CreditCard, label: "One-time Purchase", description: "Users pay once to access your product" },
    { id: "subscription", icon: Repeat, label: "Subscription", description: "Users pay a recurring fee" },
    { id: "freemium", icon: Tag, label: "Freemium", description: "Basic features free, premium features paid" },
    { id: "contact", icon: Calendar, label: "Contact for Pricing", description: "Provide contact details for pricing inquiries" }
  ];

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  const handlePricingTypeChange = (type) => {
    setPricing({
      ...pricing,
      type,
      // Reset amount when switching to/from free or contact
      amount: (type === "free" || type === "contact" || type === "freemium") ? "" : pricing.amount,
      // Reset interval when not subscription
      interval: type === "subscription" ? pricing.interval || "month" : "",
      // Initialize contact info fields when contact pricing is selected
      contactEmail: type === "contact" ? (pricing.contactEmail || "") : undefined,
      contactPhone: type === "contact" ? (pricing.contactPhone || "") : undefined,
      contactInstructions: type === "contact" ? (pricing.contactInstructions || "") : undefined,
    });
  };

  const handleToggleDiscount = () => {
    setPricing({
      ...pricing,
      discounted: !pricing.discounted,
      originalAmount: pricing.discounted ? "" : pricing.amount || "",
    });
  };

  const getSelectedCurrency = () => {
    return currencies.find(c => c.code === pricing.currency) || currencies[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Pricing Model</h2>
        <p className="text-gray-600">
          Choose how you want to price your product.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {pricingTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = pricing.type === type.id;

            return (
              <button
                key={type.id}
                onClick={() => handlePricingTypeChange(type.id)}
                className={`flex flex-col items-center text-center p-6 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  isSelected ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-semibold ${isSelected ? "text-violet-700" : "text-gray-700"}`}>
                  {type.label}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {(pricing.type === "paid" || pricing.type === "subscription" || pricing.type === "freemium") && (
        <section className="space-y-6 bg-gray-50 p-6 rounded-lg">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Price Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  value={pricing.currency}
                  onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol}) - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">
                      {getSelectedCurrency().symbol}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.amount}
                    onChange={(e) => setPricing({ ...pricing, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {pricing.type === "subscription" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Billing Interval
                </label>
                <select
                  value={pricing.interval || "month"}
                  onChange={(e) => setPricing({ ...pricing, interval: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="week">Weekly</option>
                </select>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleToggleDiscount}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  pricing.discounted
                    ? "bg-violet-100 text-violet-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Tag size={16} />
                <span>
                  {pricing.discounted
                    ? "Remove Discount"
                    : "Add Discount / Sale Price"
                }
                </span>
              </button>
            </div>

            {pricing.discounted && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700">
                  Original Price (before discount)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">
                      {getSelectedCurrency().symbol}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricing.originalAmount}
                    onChange={(e) => setPricing({ ...pricing, originalAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Contact for Pricing Section */}
      {pricing.type === "contact" && (
        <section className="space-y-6 bg-gray-50 p-6 rounded-lg border-l-4 border-violet-500">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-violet-100 p-2 rounded-full">
                <Calendar size={20} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Contact Information for Pricing Inquiries</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Provide contact details that potential customers can use to inquire about pricing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email <span className="text-violet-500">*</span>
                </label>
                <input
                  type="email"
                  value={pricing.contactEmail || ""}
                  onChange={(e) => setPricing({ ...pricing, contactEmail: e.target.value })}
                  placeholder="sales@yourcompany.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={pricing.contactPhone || ""}
                  onChange={(e) => setPricing({ ...pricing, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contact Instructions <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={pricing.contactInstructions || ""}
                onChange={(e) => setPricing({ ...pricing, contactInstructions: e.target.value })}
                placeholder="Provide any additional instructions for contacting you about pricing (e.g., business hours, preferred contact method, etc.)"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </section>
      )}

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm flex items-center gap-1"
        >
          <AlertCircle size={14} /> {error}
        </motion.p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border border-gray-300"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={
            ((pricing.type === "paid" || pricing.type === "subscription") && !pricing.amount) ||
            (pricing.type === "contact" && !pricing.contactEmail)
          }
          className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continue
          <ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default PricingSection;
