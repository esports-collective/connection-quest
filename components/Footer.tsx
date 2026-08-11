import Image from "next/image";

export default function Footer() {
  return (
    <footer className="brand-gradient mt-12 text-white">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-9 text-center">
        <Image
          src="/side-quests-logo.png"
          alt="Side Quests"
          width={260}
          height={210}
          className="h-20 w-auto object-contain"
        />
        <p className="text-sm text-white/70">
          An ESports Collective adventure · Choose your quest, level up your life.
        </p>
      </div>
    </footer>
  );
}
