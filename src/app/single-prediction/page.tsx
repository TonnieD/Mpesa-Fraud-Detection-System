"use client";

import { useState } from "react";
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface PredictResponse {
  fraud_probability: number | null;
  risk_tier: string;
  recommended_action: string;
  action_rationale: string;
}

interface FormState {
  transaction_id: string;
  amount: string;
  sender_balance_before: string;
  transaction_type: string;
  device_type: string;
  region: string;
  hour: string;
  day_of_week: string;
  month_2026: string;
}

interface FormErrors {
  transaction_id?: string;
  amount?: string;
  sender_balance_before?: string;
  transaction_type?: string;
  device_type?: string;
  region?: string;
  hour?: string;
  day_of_week?: string;
  month_2026?: string;
}

export default function SinglePrediction() {
  const [formData, setFormData] = useState<FormState>({
    transaction_id: "",
    amount: "",
    sender_balance_before: "",
    transaction_type: "peer",
    device_type: "smartphone",
    region: "Nairobi",
    hour: "",
    day_of_week: "Monday",
    month_2026: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const tempErrors: FormErrors = {};
    let isValid = true;

    if (!formData.transaction_id.trim()) {
      tempErrors.transaction_id = "Transaction ID is required";
      isValid = false;
    }

    const amt = Number(formData.amount);
    if (!formData.amount) {
      tempErrors.amount = "Amount is required";
      isValid = false;
    } else if (isNaN(amt) || amt < 1) {
      tempErrors.amount = "Minimum M-Pesa transaction is KSh 1";
      isValid = false;
    }

    const bal = Number(formData.sender_balance_before);
    if (!formData.sender_balance_before) {
      tempErrors.sender_balance_before = "Sender balance before transaction is required";
      isValid = false;
    } else if (isNaN(bal) || bal <= 0) {
      tempErrors.sender_balance_before = "Sender balance must be greater than 0";
      isValid = false;
    }

    if (!formData.transaction_type) {
      tempErrors.transaction_type = "Transaction type is required";
      isValid = false;
    }

    if (!formData.device_type) {
      tempErrors.device_type = "Device type is required";
      isValid = false;
    }

    if (!formData.region) {
      tempErrors.region = "Region is required";
      isValid = false;
    }

    const hr = Number(formData.hour);
    if (!formData.hour) {
      tempErrors.hour = "Hour is required";
      isValid = false;
    } else if (isNaN(hr) || hr < 0 || hr > 23) {
      tempErrors.hour = "Hour must be between 0 and 23";
      isValid = false;
    }

    if (!formData.day_of_week) {
      tempErrors.day_of_week = "Day of week is required";
      isValid = false;
    }

    const mth = Number(formData.month_2026);
    if (!formData.month_2026) {
      tempErrors.month_2026 = "Month is required";
      isValid = false;
    } else if (isNaN(mth) || mth < 1 || mth > 12) {
      tempErrors.month_2026 = "Month must be between 1 and 12";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setResult(null);

    if (!validate()) return;

    setLoading(true);
    setShowColdStart(false);

    // 3 seconds cold-start warning scheduler
    const timer = setTimeout(() => {
      setShowColdStart(true);
    }, 3000);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpesa-fraud-detection-system.onrender.com";
      const payload = {
        transaction_id: formData.transaction_id,
        amount: parseFloat(formData.amount),
        sender_balance_before: parseFloat(formData.sender_balance_before),
        transaction_type: formData.transaction_type,
        device_type: formData.device_type,
        region: formData.region,
        hour: parseInt(formData.hour),
        day_of_week: formData.day_of_week,
        month_2026: parseInt(formData.month_2026),
      };

      const response = await fetch(`${baseUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timer);
      setShowColdStart(false);
      setLoading(false);

      if (!response.ok) {
        throw new Error("HTTP error status code: " + response.status);
      }

      const resData: PredictResponse = await response.json();
      setResult(resData);
    } catch (err: any) {
      clearTimeout(timer);
      setShowColdStart(false);
      setLoading(false);
      setApiError("Something went wrong. Please check your inputs and try again.");
    }
  };

  const getDecisionStyles = (action: string) => {
    const norm = action.trim().toUpperCase();
    if (norm === "APPROVE" || norm === "ALLOW") {
      return {
        badge: "bg-[#4CAF50]/15 text-[#1B5E20] border-[#4CAF50]/30",
        label: "ALLOW",
        icon: CheckCircle2,
      };
    }
    if (norm === "CHALLENGE") {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "CHALLENGE",
        icon: AlertTriangle,
      };
    }
    return {
      badge: "bg-red-50 text-red-700 border-red-200",
      label: "BLOCK",
      icon: AlertCircle,
    };
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          Single Transaction Scoring
        </h1>
        <p className="text-gray-500 mt-1">
          Score an individual M-Pesa transaction in real time against the predictive ML model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. T260721.045"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all
                    ${errors.transaction_id ? "border-[#DC2626] focus:ring-[#DC2626]" : "border-gray-200"}
                  `}
                />
                {errors.transaction_id && (
                  <p className="text-xs text-[#DC2626] font-medium mt-1">{errors.transaction_id}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all
                    ${errors.amount ? "border-[#DC2626] focus:ring-[#DC2626]" : "border-gray-200"}
                  `}
                />
                {errors.amount && (
                  <p className="text-xs text-[#DC2626] font-medium mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Sender Balance Before */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sender Balance Before (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1000"
                  value={formData.sender_balance_before}
                  onChange={(e) => setFormData({ ...formData, sender_balance_before: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all
                    ${errors.sender_balance_before ? "border-[#DC2626] focus:ring-[#DC2626]" : "border-gray-200"}
                  `}
                />
                {errors.sender_balance_before && (
                  <p className="text-xs text-[#DC2626] font-medium mt-1">{errors.sender_balance_before}</p>
                )}
              </div>

              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all"
                >
                  <option value="peer">Peer-to-Peer (peer)</option>
                  <option value="till">Buy Goods Till (till)</option>
                  <option value="paybill">Paybill (paybill)</option>
                </select>
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Device Type</label>
                <select
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all"
                >
                  <option value="smartphone">Smartphone</option>
                  <option value="feature">Feature Phone</option>
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all"
                >
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                  <option value="Nakuru">Nakuru</option>
                  <option value="Eldoret">Eldoret</option>
                </select>
              </div>

              {/* Hour */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  placeholder="e.g. 14"
                  value={formData.hour}
                  onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all
                    ${errors.hour ? "border-[#DC2626] focus:ring-[#DC2626]" : "border-gray-200"}
                  `}
                />
                {errors.hour && (
                  <p className="text-xs text-[#DC2626] font-medium mt-1">{errors.hour}</p>
                )}
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              {/* Month */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Month (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="e.g. 7"
                  value={formData.month_2026}
                  onChange={(e) => setFormData({ ...formData, month_2026: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border bg-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:bg-white transition-all
                    ${errors.month_2026 ? "border-[#DC2626] focus:ring-[#DC2626]" : "border-gray-200"}
                  `}
                />
                {errors.month_2026 && (
                  <p className="text-xs text-[#DC2626] font-medium mt-1">{errors.month_2026}</p>
                )}
              </div>

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-[#1B5E20] hover:bg-[#0D1F0D] disabled:bg-[#1B5E20]/50 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scoring...</span>
                </>
              ) : (
                <span>Score Transaction</span>
              )}
            </button>
          </form>
        </div>

        {/* Results/Feedback Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Default state / Loading state feedback */}
          {loading && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px] space-y-4">
              <div className="h-12 w-12 rounded-full bg-[#4CAF50]/10 flex items-center justify-center animate-pulse">
                <ShieldCheck className="h-6 w-6 text-[#1B5E20]" />
              </div>
              <p className="font-semibold text-gray-700">Evaluating transaction metrics...</p>
              
              {showColdStart && (
                <div className="bg-[#FAFAFA] border border-amber-200 p-4 rounded-xl flex gap-2.5 items-start text-left text-amber-800 text-xs animate-fade-in">
                  <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="font-medium leading-relaxed">
                    Our prediction engine is waking up — this may take up to 30 seconds on first request. Hang tight.
                  </p>
                </div>
              )}
            </div>
          )}

          {!loading && !result && !apiError && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px] text-gray-400 space-y-3">
              <ShieldCheck className="h-12 w-12 text-gray-300 stroke-[1.5]" />
              <p className="text-sm font-semibold">Awaiting Transaction Scoring</p>
              <p className="text-xs max-w-[200px] leading-relaxed">Fill out the transaction metrics form and submit to receive a real-time risk assessment.</p>
            </div>
          )}

          {/* API Error State */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl shadow-sm text-center min-h-[300px] flex flex-col items-center justify-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-[#DC2626]" />
              <h3 className="font-bold text-red-800 text-base">Inference Failed</h3>
              <p className="text-red-700 text-xs leading-relaxed max-w-[220px] font-medium">
                {apiError}
              </p>
            </div>
          )}

          {/* Result Output Card */}
          {result && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-800">Scoring Result</h2>
              
              {/* Decision Badge */}
              {(() => {
                const styles = getDecisionStyles(result.recommended_action);
                const Icon = styles.icon;
                return (
                  <div className={`p-5 rounded-xl border flex items-center gap-4 ${styles.badge}`}>
                    <Icon className="h-8 w-8 flex-shrink-0" />
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold opacity-75">Decision Action</p>
                      <h3 className="text-2xl font-black tracking-tight">{styles.label}</h3>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4 pt-2">
                {/* Probability */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Fraud Probability</span>
                  <span className="text-sm font-bold text-gray-800">
                    {result.fraud_probability !== null 
                      ? `${(result.fraud_probability * 100).toFixed(2)}%` 
                      : "Deterministic Rule Applied"
                    }
                  </span>
                </div>

                {/* Risk Tier */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">Risk Tier</span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase
                    ${result.risk_tier.toUpperCase() === "HIGH" ? "bg-red-100 text-red-800" : ""}
                    ${result.risk_tier.toUpperCase() === "MEDIUM" ? "bg-amber-100 text-amber-800" : ""}
                    ${result.risk_tier.toUpperCase() === "LOW" ? "bg-[#4CAF50]/15 text-[#1B5E20]" : ""}
                  `}>
                    {result.risk_tier}
                  </span>
                </div>

                {/* Rationale */}
                <div className="space-y-2">
                  <span className="text-sm text-gray-500 font-semibold block">Action Rationale</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium bg-[#FAFAFA] p-3 rounded-lg border border-gray-200">
                    {result.action_rationale}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
