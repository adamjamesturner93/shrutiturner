export default function PublicLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="space-y-3">
        <div className="bg-secondary h-8 w-56 animate-pulse rounded" />
        <div className="bg-secondary h-4 w-80 animate-pulse rounded" />
      </div>
    </div>
  );
}
