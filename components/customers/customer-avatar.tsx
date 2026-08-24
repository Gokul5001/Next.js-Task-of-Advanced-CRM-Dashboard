const PALETTE = [
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-fuchsia-100 text-fuchsia-700",
];

// A simple deterministic string hash (same bit-shift approach as Java's
// String.hashCode(): hash * 31 + charCode, done via shifts instead of
// multiplication). We don't need cryptographic strength here — just a
// stable number per name so the same customer always gets the same
// avatar color across renders, instead of a random one on every mount.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CustomerAvatar({ name }: { name: string }) {
  // Deterministic index into PALETTE via the hash, so a given customer
  // always renders with the same background color.
  const colorClass = PALETTE[hashString(name) % PALETTE.length];
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${colorClass}`}
    >
      {getInitials(name)}
    </div>
  );
}