export default function AppLoading() {
  return (
    <div className="bg-secondary/20 flex min-h-screen items-center justify-center p-6">
      <div className="bg-background w-full max-w-xl space-y-4 rounded-xl border p-8 shadow-sm">
        <div className="bg-secondary h-8 w-64 animate-pulse rounded" />
        <div className="bg-secondary h-4 w-96 max-w-full animate-pulse rounded" />
        <div className="bg-secondary h-4 w-72 animate-pulse rounded" />
      </div>
    </div>
  );
}
