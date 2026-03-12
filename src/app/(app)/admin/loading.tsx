export default function AdminLoading() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="bg-secondary h-8 w-56 animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-secondary h-24 animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
