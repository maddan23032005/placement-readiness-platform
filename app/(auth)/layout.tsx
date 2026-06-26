export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[hsl(var(--brand))] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M9 2L2 6v6l7 4 7-4V6L9 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 6l7 4 7-4" stroke="white" strokeWidth="1.5"/>
                <path d="M9 10v6" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-[hsl(var(--text-primary))] tracking-tight">
              PRP
            </span>
          </div>
          <p className="text-xs text-[hsl(var(--text-muted))]">Placement Readiness Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
