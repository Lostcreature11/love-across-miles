const sections = [
  { id: "prologue", label: "Prologue" },
  { id: "why-you", label: "Why You" },
  { id: "our-diary", label: "Our Diary" },
  { id: "countdown", label: "Countdown" },
];

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center gap-8 py-4 bg-background/80 backdrop-blur-md border-b border-border">
    {sections.map((s) => (
      <a
        key={s.id}
        href={`#${s.id}`}
        className="font-body text-sm tracking-widest uppercase text-gold-accent hover:text-cream-accent transition-colors"
      >
        {s.label}
      </a>
    ))}
  </nav>
);

export default Navbar;
