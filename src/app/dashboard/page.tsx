"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Upload, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { validateAndProcessCSV, SchemaValidationResult } from "@/utils/csvProcessor";

const MAX_UPLOAD_ROWS = 1000;

// Formatting helpers
const formatAmount = (amount: number) => {
  if (amount >= 1e9) {
    return `KSh ${(amount / 1e9).toFixed(2)}B`;
  }
  if (amount >= 1e6) {
    return `KSh ${(amount / 1e6).toFixed(2)}M`;
  }
  return `KSh ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<SchemaValidationResult | null>(null);
  const [activeDatasetLabel, setActiveDatasetLabel] = useState("Training Dataset");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadDefaultData = async () => {
    try {
      setLoading(true);
      setError(null);
      setValidationReport(null);
      setActiveDatasetLabel("Training Dataset");
      setLoadingProgress("Fetching default Training Dataset...");
      
      const response = await fetch("/data/feature_engineered.csv");
      if (!response.ok) {
        throw new Error("Failed to load default training dataset from public assets.");
      }
      
      const text = await response.text();
      setLoadingProgress("Analyzing transaction patterns...");
      
      const Papa = await import("papaparse");
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];
          if (rows.length === 0) {
            setError("The dataset is empty.");
            setLoading(false);
            return;
          }

          const validation = validateAndProcessCSV(rows, false);
          if (!validation.isValid) {
            setValidationReport(validation);
            setError("Default dataset failed validation schema checks.");
            setLoading(false);
            return;
          }

          setData(validation.processedRows);
          setLoading(false);
        },
        error: (err: any) => {
          setError(`CSV parsing error: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message || "Failed to load default dataset.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      loadDefaultData();
    }
  }, [isMounted]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setValidationReport(null);
    setLoadingProgress(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        setLoadingProgress("Validating schema and feature engineering raw data...");

        const Papa = await import("papaparse");
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as any[];
            if (rows.length === 0) {
              setError("Uploaded file contains no rows.");
              setLoading(false);
              return;
            }
            if (rows.length > MAX_UPLOAD_ROWS) {
              setError(`Upload limit exceeded: File contains ${rows.length.toLocaleString()} rows. Maximum allowed is ${MAX_UPLOAD_ROWS.toLocaleString()} rows for dashboard EDA.`);
              setLoading(false);
              return;
            }

            const validation = validateAndProcessCSV(rows, false);
            if (!validation.isValid) {
              setValidationReport(validation);
              setError(`Dataset schema validation failed for "${file.name}".`);
              setLoading(false);
              return;
            }

            setData(validation.processedRows);
            const formatText = validation.formatDetected === "RAW_SYNTHETIC" 
              ? "Raw Synthetic (Auto Engineered)" 
              : "Clean Engineered";
            setActiveDatasetLabel(`${file.name} [${formatText}]`);
            setValidationReport(validation);
            setLoading(false);
          },
          error: (err: any) => {
            setError(`Parsing error: ${err.message}`);
            setLoading(false);
          }
        });
      } catch (err: any) {
        setError(err.message || "An error occurred during file upload.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Aggregations
  const totalTx = data.length;
  const fraudTx = data.filter(d => d.is_fraud === 1 || d.is_fraud === true || d.is_fraud === "1").length;
  const fraudRate = totalTx > 0 ? (fraudTx / totalTx) * 100 : 0;
  
  const totalAmount = data.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const avgAmount = totalTx > 0 ? totalAmount / totalTx : 0;

  // Chart 1: Donut (Legitimate vs Fraud)
  const classDistData = [
    { name: "Legitimate", value: totalTx - fraudTx, color: "#4CAF50" },
    { name: "Fraud", value: fraudTx, color: "#DC2626" }
  ];

  // Chart 2: Amount Distribution
  const amountBuckets = [
    { name: "0-500", min: 0, max: 500, count: 0 },
    { name: "500-1K", min: 500, max: 1000, count: 0 },
    { name: "1K-2.5K", min: 1000, max: 2500, count: 0 },
    { name: "2.5K-5K", min: 2500, max: 5000, count: 0 },
    { name: "5K-10K", min: 5000, max: 10000, count: 0 },
    { name: ">10K", min: 10000, max: Infinity, count: 0 }
  ];
  data.forEach(d => {
    const val = Number(d.amount) || 0;
    for (const b of amountBuckets) {
      if (val >= b.min && val < b.max) {
        b.count++;
        break;
      }
    }
  });

  // Chart 3: Fraud Rate by Balance Drain %
  const drainBuckets = [
    { name: "0-10%", min: 0, max: 10, total: 0, fraud: 0 },
    { name: "10-25%", min: 10, max: 25, total: 0, fraud: 0 },
    { name: "25-50%", min: 25, max: 50, total: 0, fraud: 0 },
    { name: "50-100%", min: 50, max: 100, total: 0, fraud: 0 },
    { name: "100-200%", min: 100, max: 200, total: 0, fraud: 0 },
    { name: ">200%", min: 200, max: Infinity, total: 0, fraud: 0 }
  ];
  data.forEach(d => {
    const val = Number(d.drain_rate) || 0;
    const isF = d.is_fraud === 1 || d.is_fraud === true || d.is_fraud === "1";
    for (const b of drainBuckets) {
      if (val >= b.min && val < b.max) {
        b.total++;
        if (isF) b.fraud++;
        break;
      }
    }
  });
  const drainChartData = drainBuckets.map(b => ({
    name: b.name,
    fraudRate: b.total > 0 ? (b.fraud / b.total) * 100 : 0
  }));

  // Chart 4: Fraud Rate by Amount Bracket
  const amtBracketBuckets = [
    { name: "0-500", min: 0, max: 500, total: 0, fraud: 0 },
    { name: "500-1K", min: 500, max: 1000, total: 0, fraud: 0 },
    { name: "1K-2K", min: 1000, max: 2000, total: 0, fraud: 0 },
    { name: "2K-5K", min: 2000, max: 5000, total: 0, fraud: 0 },
    { name: "5K-10K", min: 5000, max: 10000, total: 0, fraud: 0 },
    { name: ">10K", min: 10000, max: Infinity, total: 0, fraud: 0 }
  ];
  data.forEach(d => {
    const val = Number(d.amount) || 0;
    const isF = d.is_fraud === 1 || d.is_fraud === true || d.is_fraud === "1";
    for (const b of amtBracketBuckets) {
      if (val >= b.min && val < b.max) {
        b.total++;
        if (isF) b.fraud++;
        break;
      }
    }
  });
  const amtBracketChartData = amtBracketBuckets.map(b => ({
    name: b.name,
    fraudRate: b.total > 0 ? (b.fraud / b.total) * 100 : 0
  }));

  // Chart 5: Total Hourly Transactions
  const hourlyCount = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  data.forEach(d => {
    const hr = Number(d.hour);
    if (hr >= 0 && hr < 24) {
      hourlyCount[hr].count++;
    }
  });

  // Chart 6: Transactions by Day of Week
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayStats = daysOfWeek.map(day => ({ name: day, count: 0, amount: 0 }));
  data.forEach(d => {
    const dayStr = d.day_of_week;
    if (dayStr) {
      const idx = daysOfWeek.findIndex(day => day.toLowerCase() === dayStr.toString().trim().toLowerCase());
      if (idx !== -1) {
        dayStats[idx].count++;
        dayStats[idx].amount += Number(d.amount) || 0;
      }
    }
  });

  if (!isMounted) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]" />;
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Transaction Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Exploratory Data Analysis (EDA) supporting Clean Engineered and Raw Synthetic M-Pesa CSV Formats
          </p>
        </div>

        {/* Dataset Action Panel */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Database</p>
            <p className="text-sm font-bold text-[#1B5E20]">{activeDatasetLabel}</p>
          </div>
          
          <button
            onClick={loadDefaultData}
            title="Reload Training Dataset"
            className="p-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition-all shadow-sm flex items-center justify-center hover:border-gray-300 cursor-pointer"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <label className="flex items-center gap-2 bg-[#1B5E20] hover:bg-[#0D1F0D] text-white px-5 py-3 rounded-xl cursor-pointer font-medium transition-all shadow-sm">
            <Upload className="h-5 w-5" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Format Detection Badge */}
      {validationReport && validationReport.isValid && (
        <div className="bg-green-50 border border-[#4CAF50]/30 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-[#1B5E20]" />
            <div>
              <p className="text-sm font-bold text-[#1B5E20]">
                {validationReport.formatDetected === "RAW_SYNTHETIC"
                  ? "Raw Synthetic Dataset Detected — Automated Feature Engineering Applied"
                  : "Clean Engineered Dataset Format Validated"
                }
              </p>
              <p className="text-xs text-gray-600 font-medium">
                System processed {data.length.toLocaleString()} rows into required model features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box with Detailed Schema Breakdown */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-[#DC2626] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-base">Dataset Validation Error</h3>
              <p className="text-red-700 text-sm mt-1 font-medium">{error}</p>
            </div>
          </div>

          {/* Missing Required Columns */}
          {validationReport && validationReport.missingColumns.length > 0 && (
            <div className="pl-9 space-y-2">
              <p className="text-xs font-bold text-red-900 uppercase tracking-wider">
                ❌ Missing Required Columns (Must be added to CSV):
              </p>
              <div className="flex flex-wrap gap-2">
                {validationReport.missingColumns.map(col => (
                  <span key={col} className="text-xs bg-red-100 border border-red-300 text-red-800 px-2.5 py-1 rounded-md font-bold">
                    + {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Unneeded / Extra Columns */}
          {validationReport && validationReport.unneededColumns.length > 0 && (
            <div className="pl-9 space-y-2 border-t border-red-200/60 pt-3">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                ⚠️ Unneeded / Extra Columns (Should be removed from CSV):
              </p>
              <div className="flex flex-wrap gap-2">
                {validationReport.unneededColumns.map(col => (
                  <span key={col} className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-md font-bold">
                    - {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pl-9 pt-2">
            <button
              onClick={loadDefaultData}
              className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
            >
              Reset to Default Training Dataset
            </button>
          </div>
        </div>
      )}

      {/* Main Loaders */}
      {loading ? (
        <div className="space-y-8">
          <div className="bg-white border border-gray-100 p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
            <div className="h-10 w-10 border-4 border-[#A5D6A7] border-t-[#1B5E20] rounded-full animate-spin mb-4" />
            <p className="text-lg font-semibold text-[#1A1A1A]">{loadingProgress}</p>
            <p className="text-sm text-gray-500 mt-1">Processing dataset in browser memory</p>
          </div>
          <LoadingSkeleton />
        </div>
      ) : (
        <>
          {/* KPI Analytics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Transactions</p>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] mt-2">
                {totalTx.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Dataset footprint</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Fraud Transactions</p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-extrabold text-[#DC2626]">
                  {fraudTx.toLocaleString()}
                </h3>
                <span className="text-sm font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded">
                  {fraudRate.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">Anomalous triggers ratio</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Amount Transacted</p>
              <h3 className="text-3xl font-extrabold text-[#1B5E20] mt-2">
                {formatAmount(totalAmount)}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Sum aggregate processed value</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Transaction Amount</p>
              <h3 className="text-3xl font-extrabold text-[#1A1A1A] mt-2">
                KSh {avgAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-gray-400 mt-2 font-medium">Mean client ticket size</p>
            </div>
          </div>

          {/* Recharts Graphical Visualizations Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 1. Class Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Class Distribution</h3>
                <p className="text-sm text-gray-400 font-medium">Comparison of legitimate versus fraudulent cohorts</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {classDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [Number(value).toLocaleString(), "Transactions"]}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Amount Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Transaction Amount Distribution</h3>
                <p className="text-sm text-gray-400 font-medium">Right-skewed representation of transaction sizes (KSh)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={amountBuckets} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value: any) => [Number(value).toLocaleString(), "Transactions"]}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Fraud Rate by Balance Drain % */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Fraud Rate by Balance Drain %</h3>
                <p className="text-sm text-gray-400 font-medium">Risk triggers relative to percentage of sender account depleted</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={drainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis unit="%" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value: any) => [`${Number(value).toFixed(2)}%`, "Fraud Rate"]}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Bar dataKey="fraudRate" radius={[4, 4, 0, 0]}>
                      {drainChartData.map((entry, index) => {
                        let color = "#4CAF50";
                        if (entry.fraudRate > 10) color = "#DC2626";
                        else if (entry.fraudRate > 1) color = "#F59E0B";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Fraud Rate by Amount Bracket */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Fraud Rate by Transaction Amount Bracket</h3>
                <p className="text-sm text-gray-400 font-medium">Ratio of fraudulent activity grouped by ticket size brackets</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={amtBracketChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis unit="%" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value: any) => [`${Number(value).toFixed(2)}%`, "Fraud Rate"]}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Bar dataKey="fraudRate" fill="#4CAF50" radius={[4, 4, 0, 0]}>
                      {amtBracketChartData.map((entry, index) => {
                        let color = "#4CAF50";
                        if (entry.fraudRate > 10) color = "#DC2626";
                        else if (entry.fraudRate > 1) color = "#F59E0B";
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5. Hourly Activity Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Total Hourly Transactions</h3>
                <p className="text-sm text-gray-400 font-medium">Daily hourly transaction density (hour 0-23)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyCount} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value: any) => [Number(value).toLocaleString(), "Transactions"]}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#1B5E20" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 6. Day of Week Analysis */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#1A1A1A]">Transactions by Day of Week</h3>
                <p className="text-sm text-gray-400 font-medium">Total transaction velocity and sum volume compared</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dayStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#9CA3AF" />
                    <Tooltip 
                      formatter={(value: any, name: any) => {
                        if (name === "amount") return [formatAmount(Number(value)), "Transacted Vol"];
                        return [Number(value).toLocaleString(), "Tx Count"];
                      }}
                      contentStyle={{ background: "#FFFFFF", borderRadius: "12px", border: "1px solid #F3F4F6" }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2.5} name="count" dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#1B5E20" strokeWidth={2.5} name="amount" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
