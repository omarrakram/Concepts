export function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="page-loading is-busy" role="status" aria-live="polite">
      <p>{label}</p>
      <div className="progress" style={{ width: 220 }}>
        <div className="progress__bar progress__bar--indeterminate" />
      </div>
    </div>
  );
}
