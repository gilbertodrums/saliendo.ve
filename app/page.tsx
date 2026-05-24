/* ------------------------------------------------------------
   saliendo.ve — Página placeholder (Fase 0)
   Identidad visual del proyecto, sin lógica de negocio.
   Se reemplazará en Fase 3 con el Home real.
   ------------------------------------------------------------ */

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--brand-gradient)" }}
    >
      {/* Logo textual */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1
          className="text-display text-white tracking-tight"
          style={{ fontFamily: "var(--font-display), system-ui, sans-serif", fontWeight: 800 }}
        >
          saliendo.ve
        </h1>

        {/* Subtexto */}
        <p
          className="text-body text-white"
          style={{ opacity: 0.8, fontFamily: "var(--font-body), system-ui, sans-serif" }}
        >
          Pasajes de autobús en Venezuela
        </p>

        {/* Badge de estado */}
        <div
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Indicador pulsante */}
          <span
            className="block w-2 h-2 rounded-full bg-white"
            style={{ opacity: 0.9 }}
            aria-hidden="true"
          />
          <span
            className="text-body-sm text-white font-medium"
            style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontWeight: 500,
              opacity: 0.95,
              letterSpacing: "0.02em",
            }}
          >
            Próximamente · En construcción
          </span>
        </div>
      </div>

      {/* Footer minimalista */}
      <p
        className="absolute bottom-8 text-caption text-white"
        style={{
          opacity: 0.5,
          fontFamily: "var(--font-body), system-ui, sans-serif",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        © 2025 saliendo.ve
      </p>
    </main>
  );
}
