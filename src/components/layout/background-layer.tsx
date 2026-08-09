export function BackgroundLayer() {
  const url = process.env.NEXT_PUBLIC_BACKGROUND_IMAGE_URL;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {url ? (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-sm"
          style={{ backgroundImage: `url(${url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900" />
      )}
      {/* Darkening + brand-tinted gradient so glass panels stay readable on any photo */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-teal-950/50" />
    </div>
  );
}
