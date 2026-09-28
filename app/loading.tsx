export default function Loading() {
  return <main className="min-h-screen bg-[var(--bg)] p-5 text-[var(--fg)] md:p-8">
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="h-4 w-20 rounded bg-[var(--line)]" />
      <div className="mt-14 h-12 w-72 rounded bg-[var(--line)] md:h-16 md:w-96" />
      <div className="mt-4 h-4 w-full max-w-xl rounded bg-[var(--line)]" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded-2xl border border-[var(--line)] bg-[var(--panel)]" />
        <div className="h-24 rounded-2xl border border-[var(--line)] bg-[var(--panel)]" />
        <div className="h-24 rounded-2xl border border-[var(--line)] bg-[var(--panel)]" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({length:6}).map((_,i)=><div key={i} className="h-64 rounded-[26px] border border-[var(--line)] bg-[var(--panel)]" />)}
      </div>
    </div>
  </main>;
}