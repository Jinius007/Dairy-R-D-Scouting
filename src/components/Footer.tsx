export function Footer() {
  return (
    <footer className="border-t border-white/60 bg-white/40 mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              About This Tracker
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              This tracker curates publicly reported research and development across the full dairy
              value chain — from on-farm innovation to processing and product development. Sources
              include peer-reviewed journals, preprints, patents, industry press, conference
              proceedings, and academic institution announcements.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              Coverage & Automation
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Coverage spans AI & robotics, animal health, nutrition, genetics, engineering,
              processing, sustainability, digital platforms, farm management, and animal welfare.
              New items are ingested daily at 15:00 IST from OpenAlex, Europe PMC / PubMed, Crossref, arXiv,
              dairy trade-press RSS (eDairyNews, Dairy Business, The Cattle Site, and others),
              and a curated industry catalog via a GitHub Action. Department staff can install the Chrome
              briefing from this site — it pops at 16:00 IST. This page redeploys automatically
              when updates land on main.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
              Primary Sources
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              Journals & indexes: Journal of Dairy Science · Animal · JDS Communications · MDPI
              Animals · Biosystems Engineering · OpenAlex · Europe PMC · PubMed · Crossref · arXiv.
              Institutions: Wageningen · Cornell · UC Davis · Penn State · UW–Madison · Guelph ·
              Teagasc · INRAE · Agroscope · SLU · Massey · CSIRO · Embrapa · ILRI · ICAR-NDRI ·
              UNAM · UVAS. Industry: Lely · DeLaval · GEA · Tetra Pak · DSM-Firmenich · Zoetis ·
              Genus ABS · CRV · Fonterra · Arla · FrieslandCampina · Amul · Yili · Afimilk ·
              Novonesis · plus patents, IDF, ADSA, EuroTier and World Dairy Expo.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200/60 text-center">
          <p className="text-[10px] text-muted">
            Global Dairy R&D Scouting Tracker · Auto-refreshed daily · Built for innovation teams
          </p>
        </div>
      </div>
    </footer>
  );
}
