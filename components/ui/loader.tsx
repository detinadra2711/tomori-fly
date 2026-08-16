type LoaderProps = {
  label?: string;
  className?: string;
};

export function Loader({ label = "Memuat...", className = "" }: LoaderProps) {
  return (
    <div
      className={`loader ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loader-boxes" aria-hidden="true">
        {[1, 2, 3, 4].map((box) => (
          <div key={box} className={`loader-box loader-box-${box}`}>
            <div className="loader-face loader-face-front" />
            <div className="loader-face loader-face-right" />
            <div className="loader-face loader-face-top" />
            <div className="loader-face loader-face-back" />
          </div>
        ))}
      </div>
      <span className="loader-label">{label}</span>
    </div>
  );
}

export default Loader;
