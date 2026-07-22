import Link from "next/link";
import { 
  FileText, 
  Cpu, 
  Link as LinkIcon, 
  AlertTriangle, 
  LayoutDashboard, 
  ShieldCheck, 
  Files,
  Database,
  ArrowRight,
  Clock
} from "lucide-react";

export default function AboutPage() {
  const techStack = [
    { name: "XGBoost", role: "Classification Model" },
    { name: "Scikit-Learn", role: "Preprocessing & Pipelines" },
    { name: "FastAPI", role: "Backend Inference API" },
    { name: "Next.js 14", role: "Frontend Web Application" },
    { name: "Render", role: "API Infrastructure hosting" },
    { name: "Vercel", role: "Production Web Deployment" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-2">
      {/* Hero Landing Banner */}
      <section className="bg-gradient-to-br from-[#0D1F0D] via-[#1B5E20] to-[#0D1F0D] text-white p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#4CAF50]/20 border border-[#4CAF50]/30 text-[#4CAF50] text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>Real-Time Transaction Scoring</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            M-Pesa Fraud Detection System
          </h1>

          <p className="text-gray-200 text-sm md:text-base leading-relaxed font-medium">
            An intelligent fraud detection and decisioning engine built for Kenya&apos;s mobile money ecosystem. Intercepting transactions before settlement to deliver real-time <span className="text-[#4CAF50] font-bold">ALLOW</span>, <span className="text-amber-400 font-bold">CHALLENGE</span>, or <span className="text-red-400 font-bold">BLOCK</span> recommendations.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/dashboard"
              className="bg-[#4CAF50] hover:bg-[#43A047] text-[#0D1F0D] font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center gap-2 group text-sm"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/single-prediction"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Test Single Prediction</span>
            </Link>

            <Link
              href="/batch-prediction"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 text-sm"
            >
              <Files className="h-4 w-4" />
              <span>Batch CSV Scoring</span>
            </Link>
          </div>
        </div>

        {/* Decorative Background Glow */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#4CAF50]/15 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Overview & Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/dashboard" 
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1B5E20]/30 transition-all group space-y-3"
        >
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1B5E20] group-hover:scale-110 transition-transform">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#1B5E20] transition-colors">
            Analytics Dashboard
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Exploratory Data Analysis (EDA) on the 120,000 transaction Training Dataset, showing fraud ratios, account drain statistics, and hourly metrics.
          </p>
        </Link>

        <Link 
          href="/single-prediction" 
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1B5E20]/30 transition-all group space-y-3"
        >
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1B5E20] group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#1B5E20] transition-colors">
            Single Prediction
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Simulate an active transaction in real time. Returns deterministic rule evaluations combined with ML model fraud probabilities.
          </p>
        </Link>

        <Link 
          href="/batch-prediction" 
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1B5E20]/30 transition-all group space-y-3"
        >
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-[#1B5E20] group-hover:scale-110 transition-transform">
            <Files className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#1B5E20] transition-colors">
            Batch Scoring
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Upload CSV transaction files (up to 1,000 rows) for high-speed concurrent inference against the backend FastAPI microservice.
          </p>
        </Link>
      </div>

      {/* Technical Overview & Interception Layer */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-xl font-extrabold text-gray-800">System Architecture & Interception Layer</h2>
        <p className="text-sm text-gray-600 leading-relaxed font-medium">
          The system is specifically architected to sit <strong>between transaction initiation and transaction completion</strong> (intercepting payment requests before final settlement to evaluate risk in real time). Combining tuned XGBoost gradient boosted decision trees with hard deterministic rule gates, the engine evaluates incoming transfer amounts, sender account balance drain ratios, location metadata, and temporal features to issue an <strong>ALLOW</strong>, <strong>FLAG (CHALLENGE)</strong>, or <strong>BLOCK</strong> decision within low-latency bounds.
        </p>
        <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
          <strong>Note on Live Carrier Integration:</strong> In-flight transaction interception at the telecommunication switch layer is not yet implemented in production; this interface acts as a functional demonstration and analyst control panel for the scoring engine.
        </div>
      </section>

      {/* Model Performance Card */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <Cpu className="h-6 w-6 text-[#1B5E20]" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Model Performance Card</h2>
            <p className="text-xs text-gray-400 font-medium">Evaluated on 10,000 unseen test transactions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Recall (Fraud)</p>
            <p className="text-3xl font-black text-[#1B5E20] mt-1">0.68</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">Successfully captures 68% of all fraudulent transaction attempts</p>
          </div>

          <div className="bg-[#FAFAFA] p-5 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Precision (Fraud)</p>
            <p className="text-3xl font-black text-amber-600 mt-1">0.03</p>
            <p className="text-xs text-gray-500 mt-2 font-medium">3% precision rate under heavy class imbalance</p>
          </div>
        </div>

        <div className="bg-green-50/50 border border-[#4CAF50]/20 rounded-xl p-4 flex gap-3 text-xs">
          <FileText className="h-5 w-5 text-[#1B5E20] flex-shrink-0 mt-0.5" />
          <p className="text-[#1B5E20] leading-relaxed font-medium">
            <strong>Evaluation Summary:</strong> Evaluated against an unseen set of 10,000 transactions preserving the 97/3 class balance. The low precision reflects real-world mobile money environments where legitimate traffic heavily outweighs fraudulent events.
          </p>
        </div>
      </section>

      {/* Tech Stack List */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Technology Stack</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {techStack.map((tech) => (
            <div key={tech.name} className="p-3.5 bg-[#FAFAFA] border border-gray-100 rounded-xl">
              <p className="text-sm font-bold text-gray-800">{tech.name}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{tech.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Known Limitations */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <AlertTriangle className="h-6 w-6 text-[#DC2626]" />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Known Limitations & Constraints</h2>
            <p className="text-xs text-gray-400 font-medium">Technical and data boundaries of the system</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Limitation 1: Synthetic Nature of Data */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Database className="h-4 w-4 text-amber-700" />
              <span>Synthetic Nature of Dataset</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              The model was trained on a synthetic M-Pesa fraud dataset (120,000 transactions sourced from Kaggle). Due to the uniform distributions inherent in synthetic generation, only engineered features such as <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">drain_rate</code> and <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">account_emptied</code> carry strong predictive signals, capping precision at 0.03 across all classifiers.
            </p>
          </div>

          {/* Limitation 2: SMOTE & Overestimation */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <h4 className="font-bold text-gray-800 text-sm">SMOTE & Oversampling Overestimation Risk</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Applying SMOTE oversampling to synthetic data during model training may inflate evaluation performance metrics beyond what is achievable on real M-Pesa transaction feeds in production environments.
            </p>
          </div>

          {/* Limitation 3: Uncaptured Attack Vectors */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <h4 className="font-bold text-gray-800 text-sm">Uncaptured Fraud Attack Vectors</h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              The dataset lacks explicit features for critical mobile money attack vectors such as SIM swap flags, agent float manipulation, agent number masking, or device network velocity.
            </p>
          </div>

          {/* Limitation 4: Infrastructure Cold Starts */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
              <Clock className="h-4 w-4 text-gray-600" />
              <span>Infrastructure Latency (Render Free Tier)</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              The backend FastAPI inference service is hosted on Render&apos;s free web tier. Inactive web services enter a sleep state after 15 minutes, causing an initial cold-start delay of 30-50 seconds when waking up on the first request.
            </p>
          </div>

          {/* Other limitations */}
          <ul className="space-y-2.5 pl-5 list-disc text-xs text-gray-600 font-medium leading-relaxed">
            <li>
              <strong>Geographical Boundaries:</strong> Region inputs are restricted to five major Kenyan urban centers (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret) and do not reflect rural transaction grids.
            </li>
            <li>
              <strong>Case Sensitivity:</strong> Categorical input fields (transaction type, device, region, day) must match trained encoder strings exactly.
            </li>
          </ul>
        </div>
      </section>

      {/* Author & Links */}
      <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Author & Engineer</p>
          <h3 className="text-xl font-bold text-gray-800 mt-1">Anthony Ng&apos;ang&apos;a Chege</h3>
          <p className="text-sm text-[#1B5E20] font-bold">Data Scientist & ML Engineer</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Project Resources & Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="https://github.com/TonnieD/Mpesa-Fraud-Detection-System"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3.5 bg-[#FAFAFA] transition-all"
            >
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span>GitHub Repository</span>
            </a>

            <a
              href="https://mpesa-fraud-detection-system.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3.5 bg-[#FAFAFA] transition-all"
            >
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <span>Live FastAPI Docs</span>
            </a>

            <a
              href="https://anthonyngangachege.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#1B5E20] border border-gray-200 hover:border-[#1B5E20]/30 rounded-xl p-3.5 bg-[#FAFAFA] transition-all"
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
