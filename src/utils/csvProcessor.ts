export interface SchemaValidationResult {
  isValid: boolean;
  formatDetected: "CLEAN_ENGINEERED" | "RAW_SYNTHETIC" | "INVALID";
  missingColumns: string[];
  unneededColumns: string[];
  processedRows: any[];
}

export const BASE_REQUIRED_COLUMNS = [
  "amount",
  "sender_balance_before",
  "transaction_type",
  "device_type",
  "region",
  "hour",
  "day_of_week",
  "month_2026"
];

export const BATCH_REQUIRED_COLUMNS = [
  "transaction_id",
  ...BASE_REQUIRED_COLUMNS
];

export const ENGINEERED_COLUMNS = [
  "drain_rate",
  "account_emptied",
  "hour_sin",
  "hour_cos",
  "day_sin",
  "day_cos",
  "month_2026_sin",
  "month_2026_cos",
  "day"
];

export const ALLOWED_OPTIONAL_COLUMNS = [
  "transaction_id",
  "sender_balance_after",
  "receiver_balance_before",
  "receiver_balance_after",
  "is_fraud",
  "transaction_status",
  "recommended_action",
  "risk_tier",
  "action_rationale",
  "fraud_probability"
];

const ALL_VALID_COLUMNS = new Set([
  ...BATCH_REQUIRED_COLUMNS,
  ...ENGINEERED_COLUMNS,
  ...ALLOWED_OPTIONAL_COLUMNS
].map(c => c.toLowerCase()));

const DAY_MAP: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

/**
 * Feature Engineering Pipeline for Raw M-Pesa Transactions
 */
export function applyFeatureEngineering(rows: any[]): any[] {
  return rows.map(row => {
    // 1. Convert numeric inputs
    const amount = Number(row.amount) || 0;
    const senderBal = Number(row.sender_balance_before) || 0;

    // 2. Compute drain_rate & account_emptied
    const drainRate = senderBal > 0 ? (amount / senderBal) * 100 : 0;
    const accountEmptied = amount >= senderBal ? 1 : 0;

    // 3. Compute cyclic temporal encodings
    const hour = Number(row.hour) || 0;
    const dayStr = (row.day_of_week || "").toString().trim().toLowerCase();
    const dayNum = DAY_MAP[dayStr] || 1;
    const month = Number(row.month_2026) || 1;

    const hourSin = Math.sin((2 * Math.PI * hour) / 24);
    const hourCos = Math.cos((2 * Math.PI * hour) / 24);
    const daySin = Math.sin((2 * Math.PI * dayNum) / 7);
    const dayCos = Math.cos((2 * Math.PI * dayNum) / 7);
    const monthSin = Math.sin((2 * Math.PI * month) / 12);
    const monthCos = Math.cos((2 * Math.PI * month) / 12);

    return {
      ...row,
      amount,
      sender_balance_before: senderBal,
      drain_rate: row.drain_rate !== undefined && row.drain_rate !== null && row.drain_rate !== ""
        ? Number(row.drain_rate)
        : drainRate,
      account_emptied: row.account_emptied !== undefined && row.account_emptied !== null && row.account_emptied !== ""
        ? Number(row.account_emptied)
        : accountEmptied,
      day: row.day !== undefined ? Number(row.day) : dayNum,
      hour_sin: row.hour_sin !== undefined && row.hour_sin !== null && row.hour_sin !== ""
        ? Number(row.hour_sin)
        : hourSin,
      hour_cos: row.hour_cos !== undefined && row.hour_cos !== null && row.hour_cos !== ""
        ? Number(row.hour_cos)
        : hourCos,
      day_sin: row.day_sin !== undefined && row.day_sin !== null && row.day_sin !== ""
        ? Number(row.day_sin)
        : daySin,
      day_cos: row.day_cos !== undefined && row.day_cos !== null && row.day_cos !== ""
        ? Number(row.day_cos)
        : dayCos,
      month_2026_sin: row.month_2026_sin !== undefined && row.month_2026_sin !== null && row.month_2026_sin !== ""
        ? Number(row.month_2026_sin)
        : monthSin,
      month_2026_cos: row.month_2026_cos !== undefined && row.month_2026_cos !== null && row.month_2026_cos !== ""
        ? Number(row.month_2026_cos)
        : monthCos,
    };
  });
}

/**
 * Validates CSV structure, identifies missing and unneeded columns,
 * and performs feature engineering on raw synthetic M-Pesa datasets.
 */
export function validateAndProcessCSV(
  rows: any[],
  isBatch: boolean = false
): SchemaValidationResult {
  if (!rows || rows.length === 0) {
    return {
      isValid: false,
      formatDetected: "INVALID",
      missingColumns: [],
      unneededColumns: [],
      processedRows: []
    };
  }

  const rawHeaders = Object.keys(rows[0]);
  const normalizedHeaders = rawHeaders.map(h => h.trim().toLowerCase());
  const headerSet = new Set(normalizedHeaders);

  // Check required base columns
  const requiredList = isBatch ? BATCH_REQUIRED_COLUMNS : BASE_REQUIRED_COLUMNS;
  const missingColumns = requiredList.filter(col => !headerSet.has(col.toLowerCase()));

  // Identify unneeded / extra columns not in schema
  const unneededColumns = rawHeaders.filter(
    h => !ALL_VALID_COLUMNS.has(h.trim().toLowerCase())
  );

  if (missingColumns.length > 0) {
    return {
      isValid: false,
      formatDetected: "INVALID",
      missingColumns,
      unneededColumns,
      processedRows: []
    };
  }

  // Determine if CSV is Clean Engineered or Raw Synthetic Format
  const hasEngineeredFeatures = ENGINEERED_COLUMNS.every(col => headerSet.has(col.toLowerCase()));
  const formatDetected = hasEngineeredFeatures ? "CLEAN_ENGINEERED" : "RAW_SYNTHETIC";

  // Feature engineering pipeline
  const processedRows = applyFeatureEngineering(rows);

  return {
    isValid: true,
    formatDetected,
    missingColumns: [],
    unneededColumns,
    processedRows
  };
}
