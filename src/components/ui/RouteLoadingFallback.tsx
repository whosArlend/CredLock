export function RouteLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center min-h-[45vh] py-16 animate-in fade-in duration-200"
      aria-label="Loading security module"
      role="status"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-muted tracking-wide">
          Decrypting & loading security enclave...
        </span>
      </div>
    </div>
  );
}
