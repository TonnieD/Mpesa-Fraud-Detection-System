export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80 flex flex-col justify-between animate-pulse">
          <div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-48 bg-gray-100 rounded w-full flex items-end justify-between p-4 space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
              <div 
                key={bar} 
                className="bg-gray-200 rounded-t w-full" 
                style={{ height: `${Math.random() * 80 + 10}%` }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div>
      <KPISkeleton />
      <ChartSkeleton />
    </div>
  );
}
