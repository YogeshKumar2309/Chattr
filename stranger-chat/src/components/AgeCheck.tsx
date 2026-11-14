"use client";

export const AGE_KEY = "sc:age18";

export default function AgeCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex max-w-md cursor-pointer items-start gap-3 text-sm text-ink/85">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          localStorage.setItem(AGE_KEY, e.target.checked ? "1" : "0");
          onChange(e.target.checked);
        }}
        className="mt-0.5 size-4 accent-pink"
      />
      <span>
        Main 18 saal ya usse bada hoon. Kisi ko harass nahi karunga aur koi illegal ya nuksaan wala content share nahi
        karunga.
      </span>
    </label>
  );
}
