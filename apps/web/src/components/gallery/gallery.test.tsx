import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ReadyMediaItem } from "@marino/domain";
import type { GalleryCopy } from "@/content/copy";
import { EmptyTiles } from "./EmptyTiles";
import { Gallery } from "./Gallery";
import { Lightbox } from "./Lightbox";
import { PhotoCard } from "./PhotoCard";

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
  previous: "Foto anterior",
  next: "Foto siguiente",
  project: "Proyecto de {category}",
  viewLarger: "Ver más grande: {alt}",
};

const photo = (overrides: Partial<ReadyMediaItem> = {}): ReadyMediaItem => ({
  id: "0123456789abcdef",
  status: "ready",
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

const noop = () => undefined;

describe("EmptyTiles", () => {
  it("shows the message it is given, once", () => {
    const html = renderToStaticMarkup(<EmptyTiles message={copy.empty} />);
    expect(html.split(copy.empty).length - 1).toBe(1);
  });
});

describe("PhotoCard", () => {
  it("names an untitled photo after its category, in the page's language", () => {
    const html = renderToStaticMarkup(
      <PhotoCard item={photo()} mediaBase="/media" copy={copy} onOpen={noop} />,
    );
    expect(html).toContain('alt="Proyecto de Decks de alberca"');
    expect(html).toContain(
      'aria-label="Ver más grande: Proyecto de Decks de alberca"',
    );
    expect(html).not.toContain("Pool Decks");
  });

  it("prefers the client's title when there is one", () => {
    const html = renderToStaticMarkup(
      <PhotoCard
        item={photo({ title: "Casa Ortega", id: "fedcba9876543210" })}
        mediaBase="/media"
        copy={copy}
        onOpen={noop}
      />,
    );
    expect(html).toContain('alt="Casa Ortega"');
    expect(html).toContain("Decks de alberca");
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
    expect(html).toContain('aria-label="Foto anterior"');
    expect(html).toContain('aria-label="Foto siguiente"');
    expect(html).toContain("Decks de alberca");
    expect(html).not.toContain("Close");
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

  it("caps the home-page strip at the limit", () => {
    const html = renderToStaticMarkup(
      <Gallery initialItems={items} copy={copy} limit={1} />,
    );
    expect(html.match(/<figure/g)?.length).toBe(1);
  });
});
