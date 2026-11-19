/**
 * Skeleton yang meniru tata letak dashboard (sidebar, header, folder, kartu
 * dokumen, navigasi bawah) agar perpindahan ke konten asli terasa mulus.
 */
export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" aria-busy="true" aria-label="Memuat dokumen">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen sticky top-0 flex-col gap-3 bg-white border-r border-gray-200/80 p-5">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton h-5 w-28 rounded-md" />
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-9 rounded-xl" />
        ))}
      </aside>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200/70 px-4 sm:px-8 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 md:py-3.5">
          <div className="md:hidden flex items-center gap-2.5 mb-3">
            <div className="skeleton w-7 h-7 rounded-lg" />
            <div className="skeleton h-5 w-24 rounded-md" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="skeleton h-9 flex-1 md:max-w-md rounded-xl" />
            <div className="hidden md:flex gap-2.5">
              <div className="skeleton h-9 w-24 rounded-xl" />
              <div className="skeleton h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-5 sm:px-8 sm:pt-8 max-w-7xl mx-auto space-y-8 sm:space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="skeleton h-8 w-48 rounded-lg" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>

          {/* Folder */}
          <div>
            <div className="skeleton h-5 w-20 rounded-md mb-5" />
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="relative pt-3 shrink-0 w-[72%] sm:w-auto">
                  <div className="skeleton absolute top-0 left-0 w-24 h-[22px] rounded-t-xl" />
                  <div className="skeleton h-36 rounded-2xl rounded-tl-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Dokumen */}
          <div>
            <div className="skeleton h-5 w-24 rounded-md mb-5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">
                  <div className="skeleton h-24" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="flex justify-between pt-3 border-t border-gray-100">
                      <div className="skeleton h-4 w-20 rounded" />
                      <div className="skeleton h-4 w-10 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigasi bawah (mobile) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200/80" />
    </div>
  );
}
