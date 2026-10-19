"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="mono rounded-full border border-gold/60 px-4 py-2 text-ivory hover:border-gold hover:text-gold print:hidden">
      Print / save as PDF
    </button>
  );
}
