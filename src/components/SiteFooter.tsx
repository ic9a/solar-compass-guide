import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#102a2b] text-white md:mt-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 md:gap-12 md:py-16 lg:px-8">
        <div className="md:col-span-2">
          <Logo onDark />
          <p className="mt-5 max-w-md text-sm leading-7 text-white/75">
            raportsolar.ro te ajută să alegi un sistem potrivit consumului tău și să înțelegi oferta
            instalatorului înainte să iei o decizie.
          </p>
        </div>
        <div>
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
            Instrumente
          </div>
          <ul className="space-y-3 text-sm text-white/80">
            <li>
              <Link to="/recomandare-sistem" className="hover:text-foreground">
                Recomandare sistem
              </Link>
            </li>
            <li>
              <Link to="/upload-oferta" className="hover:text-foreground">
                Verifică ofertă
              </Link>
            </li>
            <li>
              <Link to="/harta-solara-romania" className="hover:text-foreground">
                Harta solară
              </Link>
            </li>
            <li>
              <Link to="/exemplu-raport" className="hover:text-foreground">
                Exemplu raport
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70">
            Informații
          </div>
          <ul className="space-y-3 text-sm text-white/80">
            <li>
              <Link
                to="/ghid-panouri-fotovoltaice"
                className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sun"
              >
                Ghiduri
              </Link>
            </li>
            <li>
              <Link to="/cum-functioneaza" className="hover:text-white">
                Cum funcționează
              </Link>
            </li>
            <li>
              <Link to="/intrebari-frecvente" className="hover:text-foreground">
                Întrebări frecvente
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/cont" className="hover:text-white">
                Cont
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-5 text-xs text-white/70 sm:flex-row sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} raportsolar.ro</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/legal/confidentialitate" className="hover:text-white">
              Confidențialitate
            </Link>
            <Link to="/legal/termeni" className="hover:text-white">
              Termeni
            </Link>
            <Link to="/legal/cookies" className="hover:text-white">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
