import Link from "next/link";

type Variant = "vti1" | "vti2";

const ASSETS: Record<Variant, { src: string; href: string }> = {
  vti1: {
    src: "/banners/ttnad1.jpg",
    href: "https://www.talktonina.app/?lang=bs&utm=vti1",
  },
  vti2: {
    src: "/banners/ttnad2.jpg",
    href: "https://www.talktonina.app/?lang=bs&utm=vti2",
  },
};

export default function NinaBanner({ variant = "vti1" }: { variant?: Variant }) {
  const { src, href } = ASSETS[variant];
  return (
    <div className="nina-banner-wrap">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="nina-banner-link"
        aria-label="Talk to Nina"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Talk to Nina" loading="lazy" />
      </Link>
    </div>
  );
}
