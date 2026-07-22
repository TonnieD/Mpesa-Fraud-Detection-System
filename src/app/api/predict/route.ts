import { NextResponse } from "next/server";

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mpesa-fraud-detection-system.onrender.com";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { amount, sender_balance_before } = payload;

    // First attempt to call external FastAPI backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      const response = await fetch(`${EXTERNAL_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (err: any) {
      console.warn("External ML API request failed or timed out. Falling back to rule engine:", err.message);
    }

    // Fallback Rule Engine (Runs when backend service is waking up, sleeping, or unreachable)
    const amt = Number(amount) || 0;
    const bal = Number(sender_balance_before) || 1;
    const drainRate = (amt / bal) * 100;
    const accountEmptied = amt >= bal ? 1 : 0;

    if (drainRate >= 100) {
      return NextResponse.json({
        fraud_probability: null,
        risk_tier: "HIGH",
        recommended_action: "BLOCK",
        action_rationale: "Transaction Exceeds Available Balance (Deterministic Hard Rule)",
      });
    }

    if (accountEmptied === 1) {
      return NextResponse.json({
        fraud_probability: null,
        risk_tier: "HIGH",
        recommended_action: "BLOCK",
        action_rationale: "Account Will Be Emptied (Deterministic Hard Rule)",
      });
    }

    // Heuristic probability estimate fallback
    const estimatedProb = Math.min(0.495, Math.max(0.01, drainRate / 200));
    return NextResponse.json({
      fraud_probability: parseFloat(estimatedProb.toFixed(3)),
      risk_tier: estimatedProb > 0.45 ? "MEDIUM" : "LOW",
      recommended_action: estimatedProb > 0.45 ? "CHALLENGE" : "ALLOW",
      action_rationale: "Low fraud probability detected (Evaluated via backup rule engine)",
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to score transaction." },
      { status: 500 }
    );
  }
}
