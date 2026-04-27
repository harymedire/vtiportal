import Link from "next/link";
import type { ArticleListItem } from "@/lib/types";
import { categoryNameToSlug } from "@/lib/categories";
import AdSlot from "./AdSlot";

type Props = {
  mostRead: ArticleListItem[];
  latest?: ArticleListItem[];
};

export default function Sidebar({ mostRead, latest }: Props) {
  return (
    <aside>
      <AdSlot
        slot="sidebar-top"
        className="ad-box ad-sidebar-top"
        placeholder="Reklama · 300×250"
      />

      <div className="sidebar-widget">
        <h3>🔥 Najčitanije</h3>
        <ul>
          {mostRead.map((a) => (
            <li key={a.id}>
              <Link href={`/${categoryNameToSlug(a.category)}/${a.slug}`}>
                {a.title}
              </Link>
            </li>
          ))}
          {mostRead.length === 0 && (
            <li style={{ color: "#aaa", fontStyle: "italic" }}>Uskoro.</li>
          )}
        </ul>
      </div>

      {latest && latest.length > 0 && (
        <div className="sidebar-widget">
          <h3>🆕 Najnovije</h3>
          <ul>
            {latest.map((a) => (
              <li key={a.id}>
                <Link href={`/${categoryNameToSlug(a.category)}/${a.slug}`}>
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky-ad">
        <AdSlot
          slot="sidebar-big"
          className="ad-box ad-sidebar-big"
          placeholder="Reklama · 300×600"
        />
      </div>
    </aside>
  );
}
