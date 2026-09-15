import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ReadyMediaItem, ReadyVideoItem } from "@marino/domain";
import type { GalleryCopy } from "@/content/copy";
import { EmptyTiles } from "./EmptyTiles";
import { Gallery } from "./Gallery";
import { Lightbox } from "./Lightbox";
import { MediaCard } from "./MediaCard";

/**
 * The island never imports a dictionary: every visible word comes in through
 * `copy`. These render the components with a made-up slice and check that
 * nothing English leaks in from a default. Static markup only — no DOM.
 */
const copy: GalleryCopy = {
  filterLabel: "Filtrar por categoría",
  all: "Todos",
  categories: {
    patios: "Patios",
    driveways: "Entradas",
    "pool-decks": "Decks de alberca",
    turf: "Pasto sintético",
    walkways: "Andadores",
    "outdoor-living": "Vida al aire libre",
  },
  empty: "Las fotos vienen en camino.",
  showing: "Mostrando {shown} de {total}.",
  close: "Cerrar",
  previous: "Anterior",
  next: "Siguiente",
  project: "Proyecto de {category}",
  viewLarger: "Ver más grande: {alt}",
  play: "Reproducir",
  pause: "Pausar",
  soundOn: "Activar el sonido",
  soundOff: "Silenciar el sonido",
  videoUnsupported: "Este navegador no puede reproducir el video.",
};

const photo = (overrides: Partial<ReadyMediaItem> = {}): ReadyMediaItem => ({
  id: "0123456789abcdef",
  status: "ready",
  kind: "photo",
  title: "",
  category: "pool-decks",
  city: "Chandler",
  detail: "",
  featured: false,
  order: 0,
  rotation: 0,
  original: { key: "originals/x.jpg", contentType: "image/jpeg", bytes: 1 },
  image: {
    width: 1800,
    height: 1200,
    widths: [480, 960],
    placeholder: "data:,",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

const video = (overrides: Partial<ReadyVideoItem> = {}): ReadyVideoItem => ({
  ...photo(),
  id: "abcdef0123456789",
  kind: "video",
  original: { key: "originals/x.mp4", contentType: "video/mp4", bytes: 1 },
  video: {
    width: 1920,
    height: 1080,
    heights: [480, 1080],
    durationSeconds: 12,
  },
  ...overrides,
});

const noop = () => undefined;

describe("EmptyTiles", () => {
  it("shows the message it is given, once", () => {
    const html = renderToStaticMarkup(<EmptyTiles message={copy.empty} />);
    expect(html.split(copy.empty).length - 1).toBe(1);
  });
});

describe("MediaCard", () => {
  it("names an untitled photo after its category, in the page's language", () => {
    const html = renderToStaticMarkup(
      <MediaCard item={photo()} mediaBase="/media" copy={copy} onOpen={noop} />,
    );
    expect(html).toContain('alt="Proyecto de Decks de alberca"');
    expect(html).toContain("Ver más grande: Proyecto de Decks de alberca");
    expect(html).not.toContain("Pool Decks");
  });

  it("prefers the client's title when there is one", () => {
    const html = renderToStaticMarkup(
      <MediaCard
        item={photo({ title: "Casa Ortega", id: "fedcba9876543210" })}
        mediaBase="/media"
        copy={copy}
        onOpen={noop}
      />,
    );
    expect(html).toContain('alt="Casa Ortega"');
    expect(html).toContain("Decks de alberca");
  });

  it("plays a video quietly, at the small rendition, over its poster", () => {
    const html = renderToStaticMarkup(
      <MediaCard item={video()} mediaBase="/media" copy={copy} onOpen={noop} />,
    );
    expect(html).toContain("/renditions/abcdef0123456789/r0/v480.mp4");
    expect(html).not.toContain("v1080.mp4");
    // The poster is the captured frame, rendered as a photo.
    expect(html).toMatch(
      /poster="[^"]*\/renditions\/abcdef0123456789\/r0\/480\.webp"/,
    );
    expect(html).toContain("loop=");
    expect(html).toContain('preload="none"');
    // No browser autoplays a video that isn't muted and inline.
    expect(html).toContain("muted=");
    expect(html).toMatch(/playsinline=/i);
  });

  it("gives a video one control, labelled from copy", () => {
    const html = renderToStaticMarkup(
      <MediaCard item={video()} mediaBase="/media" copy={copy} onOpen={noop} />,
    );
    // Nothing is playing until the island hydrates, so the control offers play.
    expect(html).toContain('aria-label="Reproducir"');
    expect(html).not.toContain("Play");
    // Still openable, and the open target is not wrapped around the control.
    expect(html).toContain("Ver más grande");
  });

  it("gives a photo no video element and a video no stray img", () => {
    expect(
      renderToStaticMarkup(
        <MediaCard
          item={photo()}
          mediaBase="/media"
          copy={copy}
          onOpen={noop}
        />,
      ),
    ).not.toContain("<video");
    expect(
      renderToStaticMarkup(
        <MediaCard
          item={video()}
          mediaBase="/media"
          copy={copy}
          onOpen={noop}
        />,
      ),
    ).not.toContain("<img");
  });
});

describe("Lightbox", () => {
  it("labels its controls from copy", () => {
    const html = renderToStaticMarkup(
      <Lightbox
        items={[photo(), photo({ id: "fedcba9876543210" })]}
        index={0}
        mediaBase="/media"
        copy={copy}
        onClose={noop}
        onStep={noop}
      />,
    );
    expect(html).toContain('aria-label="Cerrar"');
    expect(html).toContain('aria-label="Anterior"');
    expect(html).toContain('aria-label="Siguiente"');
    expect(html).toContain("Decks de alberca");
    expect(html).not.toContain("Close");
  });

  it("hands a video the big rendition and the browser's own controls", () => {
    const html = renderToStaticMarkup(
      <Lightbox
        items={[video()]}
        index={0}
        mediaBase="/media"
        copy={copy}
        onClose={noop}
        onStep={noop}
      />,
    );
    expect(html).toContain("/renditions/abcdef0123456789/r0/v1080.mp4");
    expect(html).toContain("controls=");
    expect(html).not.toContain("v480.mp4");
  });

  it("falls back to the rendition that exists when 1080 was never made", () => {
    const html = renderToStaticMarkup(
      <Lightbox
        items={[video({ video: { ...video().video, heights: [480] } })]}
        index={0}
        mediaBase="/media"
        copy={copy}
        onClose={noop}
        onStep={noop}
      />,
    );
    expect(html).toContain("/renditions/abcdef0123456789/r0/v480.mp4");
  });
});

describe("Gallery", () => {
  const items = [photo(), photo({ id: "fedcba9876543210", category: "turf" })];

  it("builds the filter chips and the count sentence from copy", () => {
    const html = renderToStaticMarkup(
      <Gallery initialItems={items} copy={copy} showFilters />,
    );
    expect(html).toContain('aria-label="Filtrar por categoría"');
    for (const label of ["Todos", ...Object.values(copy.categories)])
      expect(html).toContain(`>${label}</button>`);
    expect(html).toContain("Mostrando 2 de 2.");
    expect(html).not.toContain(">All<");
  });

  it("shows the empty state in copy when there are no photos", () => {
    const html = renderToStaticMarkup(
      <Gallery initialItems={[]} copy={copy} />,
    );
    expect(html).toContain(copy.empty);
    expect(html).not.toContain("on their way");
  });

  it("mixes photos and videos into one grid", () => {
    const html = renderToStaticMarkup(
      <Gallery initialItems={[photo(), video()]} copy={copy} />,
    );
    expect(html.match(/<figure/g)?.length).toBe(2);
    expect(html).toContain("<video");
    expect(html).toContain("<img");
  });

  it("caps the home-page strip at the limit", () => {
    const html = renderToStaticMarkup(
      <Gallery initialItems={items} copy={copy} limit={1} />,
    );
    expect(html.match(/<figure/g)?.length).toBe(1);
  });
});
