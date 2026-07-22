"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Play, 
  Download, 
  AlertTriangle, 
  Trash2,
  Clock 
} from "lucide-react";

interface ValidationResult {
  validRows: any[];
  flaggedRows: { rowNumber: number; data: any; errors: string[] }[];
  missingColumns: string[];
}

const REQUIRED_BATCH_COLUMNS = [
  "transaction_id", "amount", "sender_balance_before", "transaction_type", "device_type", "region", "hour", "day_of_week", "month_2026"
];

const VALID_TYPES = ["peer", "till", "paybill"];
const VALID_DEVICES = ["smartphone", "feature"];
const VALID_REGIONS = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];
const VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper to capitalize first letter
const capitalizeWord = (s: string) => {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const MAX_BATCH_ROWS = 1000;

export default function BatchPrediction() {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [scoringProgress, setScoringProgress] = useState<{ current: number; total: number } | null>(null);
  const [liveCounts, setLiveCounts] = useState({ allow: 0, challenge: 0, block: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [scoringActive, setScoringActive] = useState(false);
  const [showColdStart, setShowColdStart] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "text/csv") {
      processCSV(file);
    } else {
      setError("Please drop a valid CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  };

  // CSV parsing and row validation
  const processCSV = (file: File) => {
    setError(null);
    setValidation(null);
    setResults([]);
    setScoringProgress(null);
    setLiveCounts({ allow: 0, challenge: 0, block: 0 });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const Papa = await import("papaparse");

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rawRows = results.data as any[];
            if (rawRows.length === 0) {
              setError("CSV file contains no rows.");
              return;
            }

            if (rawRows.length > MAX_BATCH_ROWS) {
              setError(`Upload size limit exceeded: Upload size is restricted to a maximum of ${MAX_BATCH_ROWS.toLocaleString()} rows per batch (uploaded file contains ${rawRows.length.toLocaleString()} rows).`);
              return;
            }

            // Headers validation (case-insensitive)
            const headers = Object.keys(rawRows[0]).map(h => h.trim().toLowerCase());
            const missing = REQUIRED_BATCH_COLUMNS.filter(
              col => !headers.includes(col.toLowerCase())
            );

            if (missing.length > 0) {
              setValidation({
                validRows: [],
                flaggedRows: [],
                missingColumns: missing
              });
              return;
            }

            // Map header aliases
            const canonicalHeadersMap: { [key: string]: string } = {};
            const firstRowKeys = Object.keys(rawRows[0]);
            firstRowKeys.forEach(k => {
              const matched = REQUIRED_BATCH_COLUMNS.find(c => c.toLowerCase() === k.trim().toLowerCase());
              if (matched) {
                canonicalHeadersMap[matched] = k;
              }
            });

            const validRows: any[] = [];
            const flaggedRows: any[] = [];

            rawRows.forEach((row, index) => {
              const rowErrors: string[] = [];
              const normalizedRow: any = {};

              // 1. Transaction ID
              const txIdKey = canonicalHeadersMap["transaction_id"];
              const txId = row[txIdKey] ? row[txIdKey].toString().trim() : "";
              if (!txId) {
                rowErrors.push("Transaction ID is missing");
              }
              normalizedRow.transaction_id = txId;

              // 2. Amount
              const amtKey = canonicalHeadersMap["amount"];
              const amtVal = row[amtKey];
              const amt = Number(amtVal);
              if (amtVal === undefined || amtVal === null || amtVal === "" || isNaN(amt)) {
                rowErrors.push("Amount must be numeric");
              } else if (amt < 1) {
                rowErrors.push("Amount must be >= 1");
              }
              normalizedRow.amount = amt;

              // 3. Sender Balance Before
              const balKey = canonicalHeadersMap["sender_balance_before"];
              const balVal = row[balKey];
              const bal = Number(balVal);
              if (balVal === undefined || balVal === null || balVal === "" || isNaN(bal)) {
                rowErrors.push("Sender balance before must be numeric");
              } else if (bal <= 0) {
                rowErrors.push("Sender balance must be > 0");
              }
              normalizedRow.sender_balance_before = bal;

              // 4. Transaction Type
              const typeKey = canonicalHeadersMap["transaction_type"];
              const rawType = row[typeKey] ? row[typeKey].toString().trim().toLowerCase() : "";
              if (!VALID_TYPES.includes(rawType)) {
                rowErrors.push(`Transaction type must be one of: ${VALID_TYPES.join(", ")}`);
              }
              normalizedRow.transaction_type = rawType;

              // 5. Device Type
              const deviceKey = canonicalHeadersMap["device_type"];
              const rawDevice = row[deviceKey] ? row[deviceKey].toString().trim().toLowerCase() : "";
              if (!VALID_DEVICES.includes(rawDevice)) {
                rowErrors.push(`Device type must be one of: ${VALID_DEVICES.join(", ")}`);
              }
              normalizedRow.device_type = rawDevice;

              // 6. Region
              const regionKey = canonicalHeadersMap["region"];
              const rawRegion = row[regionKey] ? capitalizeWord(row[regionKey].toString().trim()) : "";
              if (!VALID_REGIONS.includes(rawRegion)) {
                rowErrors.push(`Region must be one of: ${VALID_REGIONS.join(", ")}`);
              }
              normalizedRow.region = rawRegion;

              // 7. Hour
              const hourKey = canonicalHeadersMap["hour"];
              const hrVal = row[hourKey];
              const hr = parseInt(hrVal);
              if (hrVal === undefined || hrVal === null || hrVal === "" || isNaN(hr) || hr < 0 || hr > 23) {
                rowErrors.push("Hour must be between 0 and 23");
              }
              normalizedRow.hour = hr;

              // 8. Day of Week
              const dayKey = canonicalHeadersMap["day_of_week"];
              const rawDay = row[dayKey] ? capitalizeWord(row[dayKey].toString().trim()) : "";
              if (!VALID_DAYS.includes(rawDay)) {
                rowErrors.push(`Day of week must be one of: ${VALID_DAYS.join(", ")}`);
              }
              normalizedRow.day_of_week = rawDay;

              // 9. Month
              const monthKey = canonicalHeadersMap["month_2026"];
              const mthVal = row[monthKey];
              const mth = parseInt(mthVal);
              if (mthVal === undefined || mthVal === null || mthVal === "" || isNaN(mth) || mth < 1 || mth > 12) {
                rowErrors.push("Month must be between 1 and 12");
              }
              normalizedRow.month_2026 = mth;

              if (rowErrors.length > 0) {
                flaggedRows.push({
                  rowNumber: index + 2, // 1-indexed, skipping header
                  data: row,
                  errors: rowErrors
                });
              } else {
                validRows.push(normalizedRow);
              }
            });

            setValidation({
              validRows,
              flaggedRows,
              missingColumns: []
            });
          },
          error: (err: any) => {
            setError(`Error reading CSV: ${err.message}`);
          }
        });
      } catch (err: any) {
        setError(err.message || "Failed to process CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Concurrent scoring loop
  const scoreBatch = async () => {
    if (!validation || validation.validRows.length === 0) return;

    setScoringActive(true);
    setResults([]);
    setShowColdStart(false);
    
    const rowsToScore = validation.validRows;
    const total = rowsToScore.length;
    setScoringProgress({ current: 0, total });

    const scoredResults: any[] = [];
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://mpesa-fraud-detection-system.onrender.com";
    
    // Concurrency Scheduler variables
    const CONCURRENCY_LIMIT = 5;
    let index = 0;
    let completed = 0;

    let allowCount = 0;
    let challengeCount = 0;
    let blockCount = 0;

    // Cold start notification timer
    const coldStartTimer = setTimeout(() => {
      setShowColdStart(true);
    }, 3000);

    const worker = async () => {
      while (index < total) {
        const currentIndex = index++;
        const row = rowsToScore[currentIndex];

        try {
          const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });

          // Disengage cold start warning upon the first successful API resolve
          if (completed === 0) {
            clearTimeout(coldStartTimer);
            setShowColdStart(false);
          }

          if (!res.ok) throw new Error("HTTP error " + res.status);
          
          const prediction = await res.json();
          scoredResults[currentIndex] = {
            ...row,
            recommended_action: prediction.recommended_action,
            risk_tier: prediction.risk_tier,
            fraud_probability: prediction.fraud_probability,
            action_rationale: prediction.action_rationale,
            status: "SUCCESS"
          };
        } catch (err: any) {
          scoredResults[currentIndex] = {
            ...row,
            recommended_action: "BLOCK",
            risk_tier: "UNKNOWN",
            fraud_probability: null,
            action_rationale: "API Inference error or network timeout occurred",
            status: "FAILED"
          };
        }

        const rec = (scoredResults[currentIndex].recommended_action || "").toUpperCase();
        if (rec === "ALLOW" || rec === "APPROVE") {
          allowCount++;
        } else if (rec === "CHALLENGE") {
          challengeCount++;
        } else {
          blockCount++;
        }

        completed++;
        setLiveCounts({ allow: allowCount, challenge: challengeCount, block: blockCount });
        setScoringProgress({ current: completed, total: total });
      }
    };

    // Spin up workers
    const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, total) }, () => worker());
    await Promise.all(workers);

    clearTimeout(coldStartTimer);
    setShowColdStart(false);
    setScoringActive(false);
    setResults(scoredResults);
  };

  // Download results as CSV
  const handleDownload = async () => {
    if (results.length === 0) return;

    const unparseData = results.map(r => ({
      transaction_id: r.transaction_id,
      amount: r.amount,
      sender_balance_before: r.sender_balance_before,
      transaction_type: r.transaction_type,
      device_type: r.device_type,
      region: r.region,
      hour: r.hour,
      day_of_week: r.day_of_week,
      month_2026: r.month_2026,
      decision: r.recommended_action === "APPROVE" ? "ALLOW" : r.recommended_action,
      risk_tier: r.risk_tier,
      fraud_probability: r.fraud_probability !== null ? r.fraud_probability : "Deterministic Rule",
      action_rationale: r.action_rationale
    }));

    const Papa = await import("papaparse");
    const csvContent = Papa.unparse(unparseData);
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mpesa_scored_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render stats metrics
  const totalScored = results.length;
  const allowCount = results.filter(r => r.recommended_action === "APPROVE" || r.recommended_action === "ALLOW").length;
  const challengeCount = results.filter(r => r.recommended_action === "CHALLENGE").length;
  const blockCount = results.filter(r => r.recommended_action === "BLOCK").length;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          Batch Transaction Scoring
        </h1>
        <p className="text-gray-500 mt-1">
          Upload a CSV of transactions and score them all concurrently against the predictive API
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {!validation && !scoringActive && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all flex flex-col items-center justify-center min-h-[300px] cursor-pointer
            ${dragActive ? "border-[#4CAF50] bg-[#4CAF50]/5" : "border-gray-300 bg-white hover:border-gray-400"}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <Upload className="h-12 w-12 text-gray-400 mb-4 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-gray-700">Drag & drop your CSV file here</h3>
          <p className="text-sm text-gray-500 mt-1">or click to browse from explorer</p>
          <span className="mt-2 inline-block text-xs font-bold text-[#1B5E20] bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Max size limit: 1,000 rows per batch
          </span>
          
          <div className="mt-6 border-t border-gray-100 pt-4 w-full max-w-md text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">Required Schema Fields</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {REQUIRED_BATCH_COLUMNS.map(col => (
                <span key={col} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded font-medium">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Output */}
      {error && (
        <div className="bg-red-50 border-l-4 border-[#DC2626] p-4 rounded-xl flex gap-3 shadow-sm">
          <XCircle className="h-5 w-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">CSV Error</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Column Schema Error */}
      {validation && validation.missingColumns.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex gap-3">
            <XCircle className="h-6 w-6 text-[#DC2626] flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-800">Missing Required Schema Headers</h3>
              <p className="text-red-700 text-sm mt-1 leading-relaxed">
                The uploaded CSV is missing columns required by the predictive engine. Please resolve these headers:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-9">
            {validation.missingColumns.map(col => (
              <span key={col} className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-md font-bold">
                {col}
              </span>
            ))}
          </div>
          <div className="pl-9 pt-2">
            <button
              onClick={() => setValidation(null)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-all"
            >
              Upload New CSV
            </button>
          </div>
        </div>
      )}

      {/* Validation Summary State */}
      {validation && validation.missingColumns.length === 0 && !scoringActive && results.length === 0 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-800">CSV Validation Report</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valid Rows Count */}
            <div className="bg-green-50/50 border border-[#4CAF50]/20 rounded-xl p-5 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#4CAF50] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-800">Ready to score</h4>
                <p className="text-3xl font-black text-[#1B5E20] mt-1">
                  {validation.validRows.length} <span className="text-sm font-medium text-gray-500">rows</span>
                </p>
              </div>
            </div>

            {/* Invalid Rows Count */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-800">Flagged with errors</h4>
                <p className="text-3xl font-black text-amber-700 mt-1">
                  {validation.flaggedRows.length} <span className="text-sm font-medium text-gray-500">rows</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed errors if any */}
          {validation.flaggedRows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Flagged Validation Errors</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-[#FAFAFA] sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider w-20">Row</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Invalid Flags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {validation.flaggedRows.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 font-semibold text-gray-700">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-medium text-red-600 space-y-1">
                          {row.errors.map((e, idx) => (
                            <p key={idx}>{e}</p>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validation.flaggedRows.length > 10 && (
                <p className="text-xs text-gray-400 font-medium">Showing first 10 validation failures...</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={scoreBatch}
              disabled={validation.validRows.length === 0}
              className="bg-[#1B5E20] hover:bg-[#0D1F0D] disabled:bg-[#1B5E20]/50 text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Score Valid Rows</span>
            </button>
            
            <button
              onClick={() => setValidation(null)}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-5 w-5" />
              <span>Cancel & Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Progress state */}
      {scoringActive && scoringProgress && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Batch Scoring in Progress</h3>
              <p className="text-sm text-gray-400 font-medium mt-0.5">Concurrently evaluating predictions...</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#1B5E20]">
                {scoringProgress.current} <span className="text-gray-400 font-medium text-sm">/ {scoringProgress.total} processed</span>
              </span>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                {Math.round((scoringProgress.current / scoringProgress.total) * 100)}% Complete
              </p>
            </div>
          </div>

          {/* Decisions predicted so far live tally */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Decisions Predicted So Far</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-xl text-center">
                <p className="text-xs font-bold text-[#1B5E20] uppercase">ALLOW</p>
                <p className="text-2xl font-black text-[#1B5E20] mt-1">{liveCounts.allow}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-800 uppercase">CHALLENGE</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{liveCounts.challenge}</p>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-xs font-bold text-red-800 uppercase">BLOCK</p>
                <p className="text-2xl font-black text-[#DC2626] mt-1">{liveCounts.block}</p>
              </div>
            </div>
          </div>

          {/* Cold Start Indicator during batch run */}
          {showColdStart && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-2.5 items-start text-amber-800 text-xs animate-fade-in">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                Our prediction engine is waking up — this may take up to 30 seconds on first request. Hang tight.
              </p>
            </div>
          )}

          {/* Custom Progress bar */}
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-[#4CAF50] h-full transition-all duration-300"
              style={{ width: `${(scoringProgress.current / scoringProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results View */}
      {results.length > 0 && !scoringActive && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-8">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Scored</p>
                <p className="text-2xl font-black text-gray-800 mt-1">{totalScored.toLocaleString()}</p>
              </div>
              <div className="border-r border-gray-200 h-10" />
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ALLOW</p>
                <p className="text-2xl font-black text-[#1B5E20] mt-1">{allowCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">CHALLENGE</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{challengeCount}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">BLOCK</p>
                <p className="text-2xl font-black text-[#DC2626] mt-1">{blockCount}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="bg-[#1B5E20] hover:bg-[#0D1F0D] text-white font-semibold px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Download className="h-5 w-5" />
                <span>Download Results CSV</span>
              </button>

              <button
                onClick={() => {
                  setValidation(null);
                  setResults([]);
                }}
                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
                <span>Upload New Batch</span>
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-[#FAFAFA] sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Amount (KSh)</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Decision</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Risk Tier</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Fraud Prob</th>
                    <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {results.map((row, i) => {
                    const recAct = row.recommended_action.trim().toUpperCase();
                    const isAllow = recAct === "APPROVE" || recAct === "ALLOW";
                    const isChallenge = recAct === "CHALLENGE";

                    let rowColor = "hover:bg-gray-50";
                    let badgeColor = "";
                    let label = "";

                    if (isAllow) {
                      rowColor = "bg-[#4CAF50]/5 hover:bg-[#4CAF50]/10";
                      badgeColor = "bg-[#4CAF50]/15 text-[#1B5E20] border-[#4CAF50]/30";
                      label = "ALLOW";
                    } else if (isChallenge) {
                      rowColor = "bg-amber-50/50 hover:bg-amber-50";
                      badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                      label = "CHALLENGE";
                    } else {
                      rowColor = "bg-red-50/40 hover:bg-red-50/60";
                      badgeColor = "bg-red-100 text-red-800 border-red-200";
                      label = "BLOCK";
                    }

                    return (
                      <tr key={i} className={rowColor}>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{row.transaction_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-700">KSh {row.amount.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase ${badgeColor}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase
                            ${row.risk_tier.toUpperCase() === "HIGH" ? "bg-red-100 text-red-800" : ""}
                            ${row.risk_tier.toUpperCase() === "MEDIUM" ? "bg-amber-100 text-amber-800" : ""}
                            ${row.risk_tier.toUpperCase() === "LOW" ? "bg-[#4CAF50]/15 text-[#1B5E20]" : ""}
                          `}>
                            {row.risk_tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">
                          {row.fraud_probability !== null 
                            ? `${(row.fraud_probability * 100).toFixed(2)}%`
                            : "Rule Applied"
                          }
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-500 text-xs">{row.action_rationale}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
