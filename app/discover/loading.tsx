export default function DiscoverLoading() {
  return <main className="min-h-screen bg-[var(--bg)] p-5 text-[var(--fg)] md:p-8">
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="h-4 w-20 rounded bg-[var(--line)]" />
      <div className="mt-12 h-14 w-80 rounded bg-[var(--line)] md:h-20 md:w-[520px]" />
      <div className="mt-5 h-4 w-full max-w-2xl rounded bg-[var(--line)]" />
      <div className="mt-8 h-12 rounded-2xl bg-[var(--panel)]" />
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({length:9}).map((_,i)=><div key={i} className="h-64 rounded-[26px] border border-[var(--line)] bg-[var(--panel)]" />)}
      </div>
    </div>
  </main>;
}