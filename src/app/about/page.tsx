import { FileText, Cpu, Link as LinkIcon, AlertTriangle } from "lucide-react";

export default function About() {
  const techStack = [
    { name: "XGBoost", role: "Classification Model" },
    { name: "Scikit-Learn", role: "Preprocessing & Pipelines" },
    { name: "FastAPI", role: "Backend Inference API" },
    { name: "Next.js 14", role: "Frontend Web Application" },
    { name: "Render", role: "API Infrastructure hosting" },
    { name: "Vercel", role: "Production Web Deployment" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Info */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
          About the System
        </h1>
        <p className="text-gray-500 mt-1">
          Technical specifications and model architecture details for the M-Pesa Fraud Detection System
        </p>
      </div>

      {/* Project Description */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Project Overview</h2>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          The M-Pesa Fraud Detection System is a full-stack machine learning solution designed to evaluate
          mobile money transactions in real time. Combining gradient boosted trees with engineered rules, the system inspects incoming transaction values, historical user balance ratios, and context-based inputs (device profile, hour, location) to classify transfers as Allow, Challenge, or Block. This dashboard serves as both a portfolio project demonstrating model deployment and a mock control panel for fraud analysts.
        </p>
      </section>

      {/* Model Card Metrics */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-[#1B5E20]" />
          <h2 className="text-lg font-bold text-gray-800">Model Performance Card</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Recall</p>
            <p className="text-3xl font-black text-[#1B5E20] mt-1">0.68</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Captures 68% of all fraudulent transaction attempts</p>
          </div>

          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Precision</p>
            <p className="text-3xl font-black text-amber-600 mt-1">0.03</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">3% precision rate under heavy class imbalance</p>
          </div>
        </div>

        <div className="bg-green-50/50 border border-[#4CAF50]/20 rounded-xl p-4 flex gap-3 text-xs">
          <FileText className="h-5 w-5 text-[#1B5E20] flex-shrink-0 mt-0.5" />
          <p className="text-[#1B5E20] leading-relaxed font-medium">
            Evaluated on 10,000 unseen test transactions. The low precision is a normal characteristic of real-world fraud detection pipelines where legitimate traffic dominates, requiring Challenge queues to filter out false alerts.
          </p>
        </div>
      </section>

      {/* Tech Stack List */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Technology Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {techStack.map((tech) => (
            <div key={tech.name} className="p-3 bg-[#FAFAFA] border border-gray-100 rounded-xl">
              <p className="text-sm font-bold text-gray-800">{tech.name}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{tech.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Known Limitations */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
          <h2 className="text-lg font-bold text-gray-800">Known Limitations</h2>
        </div>
        <ul className="space-y-3 pl-5 list-disc text-sm text-gray-600 font-medium leading-relaxed">
          <li>
            <strong>High Class Imbalance:</strong> Mobile money fraud occurs in less than 0.1% of transactions, resulting in a low model precision of 0.03.
          </li>
          <li>
            <strong>Feature Engineering Dependency:</strong> The system relies heavily on engineered features (e.g. balance drain rate, hour sine/cosine). If these variables are incorrectly computed upstream, model predictions diverge.
          </li>
          <li>
            <strong>Geographical Constraints:</strong> Regions are constrained to five major Kenyan cities (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret) and might not generalize to rural transaction grids.
          </li>
          <li>
            <strong>Infrastructure Latency:</strong> The backend inference API is hosted on Render's free tier, which results in a cold-start sleep of 30-50 seconds when inactive.
          </li>
        </ul>
      </section>

      {/* Project References & Author */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Author & Creator</p>
          <h3 className="text-lg font-bold text-gray-800 mt-1">Anthony Ng&apos;ang&apos;a Chege</h3>
          <p className="text-sm text-[#1B5E20] font-medium">Data Scientist & ML Engineer</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Project Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="https://github.com/TonnieD/Mpesa-Fraud-Detection-System"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3 bg-[#FAFAFA] transition-all"
            >
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span>GitHub Repository</span>
            </a>

            <a
              href="https://mpesa-fraud-detection-system.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3 bg-[#FAFAFA] transition-all"
            >
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span>Live API Documentation</span>
            </a>

            <a
              href="https://anthonyngangachege.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3 bg-[#FAFAFA] transition-all"
            >
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span>Developer Portfolio</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
