import { useState, useCallback } from "react";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface CouponValidationResult {
  valid: boolean;
  message: string;
  discount?: number;
  discountType?: "percentage" | "fixed" | "freeShipping";
}

interface AppliedCoupon {
  code: string;
  discount: number;
  discountType: string;
}

export function useCoupon() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const validateCoupon = useCallback(async (
    code: string, 
    orderTotal: number
  ): Promise<CouponValidationResult> => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code, orderTotal }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          message: data.message || "Invalid coupon code",
        };
      }

      // Apply discount calculation
      let discount = 0;
      if (data.coupon.discountType === "percentage") {
        discount = (orderTotal * data.coupon.discountValue) / 100;
        if (data.coupon.maximumDiscount) {
          discount = Math.min(discount, data.coupon.maximumDiscount);
        }
      } else if (data.coupon.discountType === "fixed") {
        discount = Math.min(data.coupon.discountValue, orderTotal);
      }

      setAppliedCoupon({
        code: data.coupon.code,
        discount: Math.round(discount * 100) / 100,
        discountType: data.coupon.discountType,
      });

      return {
        valid: true,
        message: "Coupon applied successfully!",
        discount: Math.round(discount * 100) / 100,
        discountType: data.coupon.discountType,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to validate coupon";
      setError(message);
      return {
        valid: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setError(null);
  }, []);

  const calculateDiscount = useCallback((
    couponCode: string,
    discountType: "percentage" | "fixed" | "freeShipping",
    discountValue: number,
    orderTotal: number,
    maximumDiscount?: number
  ): number => {
    let discount = 0;

    switch (discountType) {
      case "percentage":
        discount = (orderTotal * discountValue) / 100;
        if (maximumDiscount) {
          discount = Math.min(discount, maximumDiscount);
        }
        break;
      case "fixed":
        discount = Math.min(discountValue, orderTotal);
        break;
      case "freeShipping":
        discount = 0; // Handle in shipping calculation
        break;
    }

    return Math.round(discount * 100) / 100;
  }, []);

  return {
    validateCoupon,
    removeCoupon,
    calculateDiscount,
    appliedCoupon,
    loading,
    error,
  };
}

