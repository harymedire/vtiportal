import Link from "next/link";

export default function NinaBanner() {
  return (
    <div className="nina-banner-wrap">
      <Link
        href="https://www.talktonina.app/?lang=sr"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="nina-banner-link"
        aria-label="Talk to Nina"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/banners/ttnad1.jpg" alt="Talk to Nina" loading="lazy" />
      </Link>
    </div>
  );
}
