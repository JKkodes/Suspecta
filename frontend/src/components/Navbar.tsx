import { NavLink } from "react-router-dom";

const linkBase =
  "case-label text-xs px-3 py-2 border-b-2 transition-colors duration-150";

function navClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${
    isActive ? "border-brick text-cream" : "border-transparent text-cream-dim hover:text-cream hover:border-cream-dim"
  }`;
}

export default function Navbar() {
  return (
    <header className="border-b border-navy-lighter bg-navy/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <NavLink to="/" className="flex items-baseline gap-2">
          <span className="stamp text-xl text-brick-light">Suspecta</span>
          <span className="case-label text-[10px] text-cream-dim hidden sm:inline">case file open</span>
        </NavLink>
        <nav className="flex gap-1">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/conversation-checker" className={navClass}>
            Conversation
          </NavLink>
          <NavLink to="/url-checker" className={navClass}>
            URL Check
          </NavLink>
          <NavLink to="/about" className={navClass}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}