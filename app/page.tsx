/* eslint-disable @next/next/no-img-element -- Creator Studio may provide remote TikTok oEmbed thumbnails. */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play, Search } from "lucide-react";

import { EditionFooter } from "@/components/store/edition-footer";
import { EditionHeaderServer } from "@/components/store/edition-header-server";
import { StoryTile } from "@/components/store/story-tile";
import { listPublicStories, listPublicStoryCollections } from "@/lib/data/stories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stories, categories] = await Promise.all([
    listPublicStories({ limit: 12 }),
    listPublicStoryCollections(),
  ]);
  const featured = stories[0];
  const newest = stories.slice(1, 7);

  return (
    <main className="edition-page sophiee-home">
      <EditionHeaderServer />

      <section className="sophiee-hero">
        <div className="sophiee-hero__copy">
          <p className="edition-eyebrow">FASHION · HOME · BEAUTY · FITNESS · EVERYDAY</p>
          <h1>See the find.<br/><em>Then decide.</em></h1>
          <p className="sophiee-hero__lede">
            Sophiee&apos;s real-life edit of fashion, home, beauty, fitness and
            everyday pieces worth a closer look before you add them to your life.
          </p>
          <div className="sophiee-hero__actions">
            <Link className="sophiee-button sophiee-button--primary" href="/discover">
              Explore the latest finds <ArrowRight size={17}/>
            </Link>
            <Link className="sophiee-button sophiee-button--quiet" href="/search">
              <Search size={16}/> Find something
            </Link>
          </div>
          <p className="sophiee-hero__principle">
            Watch it in motion. See the details. Follow the exact TikTok post
            when you&apos;re ready to shop.
          </p>
        </div>

        <div className="sophiee-hero__visual" aria-label="Sophiee and selected finds">
          <figure className="sophiee-portrait">
            <Image
              src="/creator-content/sophiee/profile.jpg"
              alt="Sophiee, creator of Sophiee Finds"
              fill
              priority
              sizes="(max-width: 760px) 82vw, 42vw"
            />
            <figcaption>@sopheeeb</figcaption>
          </figure>
          {featured ? (
            <Link className="sophiee-featured-peek" href={`/watch/${featured.slug}`}>
              <img src={featured.thumbnailUrl} alt={featured.altText}/>
              <span><Play size={13} fill="currentColor"/> Watch this find</span>
            </Link>
          ) : null}
          <div className="sophiee-monogram" aria-hidden="true">SF</div>
        </div>
      </section>

      <section className="sophiee-manifesto">
        <p className="edition-eyebrow">THE SOPHIEE POINT OF VIEW</p>
        <h2>Watch in context.<br/><em>Choose with confidence.</em></h2>
        <p>
          Every find starts with the original video. See the fit, finish and
          small details first, then take the exact TikTok path when you are
          ready.
        </p>
      </section>

      {categories.length ? (
        <section className="sophiee-collections">
          <div className="sophiee-section-head">
            <div>
              <p className="edition-eyebrow">SHOP BY MOOD</p>
              <h2>Start with what<br/><em>you&apos;re looking for.</em></h2>
            </div>
            <Link href="/discover">View every video <ArrowUpRight size={16}/></Link>
          </div>
          <div className="sophiee-collection-grid">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                className={`sophiee-collection-card sophiee-collection-card--${index % 5}`}
                href={`/collections/${category.slug}`}
              >
                {category.coverUrl ? <img src={category.coverUrl} alt=""/> : null}
                <span className="sophiee-collection-card__number">{String(index + 1).padStart(2, "0")}</span>
                <div className="sophiee-collection-card__copy">
                  <p>{category.description || `${category.storyCount} finds to explore.`}</p>
                  <h3>{category.title}<ArrowUpRight size={19}/></h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featured ? (
        <section className="sophiee-feature">
          <div className="sophiee-feature__media">
            <img src={featured.thumbnailUrl} alt={featured.altText}/>
            <Link href={`/watch/${featured.slug}`} aria-label={`Watch ${featured.title}`}>
              <Play size={24} fill="currentColor"/>
            </Link>
          </div>
          <div className="sophiee-feature__copy">
            <p className="edition-eyebrow">{featured.collection.title} · CURRENT FAVOURITE</p>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <Link className="sophiee-button sophiee-button--primary" href={`/watch/${featured.slug}`}>
              Watch the original video <ArrowRight size={17}/>
            </Link>
          </div>
        </section>
      ) : null}

      {newest.length ? (
        <section className="sophiee-new">
          <div className="sophiee-section-head">
            <div>
              <p className="edition-eyebrow">NEW TO THE EDIT</p>
              <h2>Worth another<br/><em>look.</em></h2>
            </div>
              <p>Recent finds from Sophiee&apos;s wardrobe, home, routine and everyday life.</p>
          </div>
          <div className="edition-story-row">
            {newest.map((video, index) => <StoryTile key={video.id} video={video} index={index}/>)}
          </div>
        </section>
      ) : null}

      <section className="sophiee-tiktok-cta">
        <p className="edition-eyebrow">FOLLOW THE FULL STORY</p>
        <h2>New finds arrive on TikTok first.</h2>
        <a href="https://www.tiktok.com/@sopheeeb" target="_blank" rel="noreferrer">
          Visit @sopheeeb <ArrowUpRight size={17}/>
        </a>
      </section>

      <EditionFooter />
    </main>
  );
}
