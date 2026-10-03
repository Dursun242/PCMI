import { describe, expect, test } from "vitest";
import { shareableImages, withSeo } from "./seo";

describe("withSeo", () => {
  test("garde la langue, le nom du site et le type sur les pages intérieures", () => {
    // Next remplace l'objet openGraph du layout au lieu de le fusionner :
    // chaque page doit donc porter ces valeurs elle-même.
    const meta = withSeo("/tarifs", { title: "Tarifs", description: "Prix fixes" });

    expect(meta.openGraph).toMatchObject({ locale: "fr_FR", type: "website", url: expect.stringMatching(/\/tarifs$/) });
    expect((meta.openGraph as { siteName?: string }).siteName).toBeTruthy();
  });

  test("donne l'image de partage par défaut à une page qui n'en a pas (y compris un article à illustration SVG)", () => {
    const plain = withSeo("/tarifs", { title: "Tarifs", description: "Prix fixes" });
    const svgArticle = withSeo("/conseils/x", { title: "A", description: "D", openGraph: { type: "article", images: shareableImages("/conseils/x.svg") } });

    for (const meta of [plain, svgArticle]) {
      expect(meta.openGraph).toMatchObject({ images: [expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })] });
    }
  });

  test("laisse une page surcharger le type et les images", () => {
    const meta = withSeo("/conseils/x", {
      title: "Article",
      description: "Desc",
      openGraph: { type: "article", images: [{ url: "/uploads/photo.jpg" }] },
    });

    expect(meta.openGraph).toMatchObject({ type: "article", locale: "fr_FR", images: [{ url: "/uploads/photo.jpg" }] });
  });
});

describe("shareableImages", () => {
  test("garde les images matricielles", () => {
    expect(shareableImages("/uploads/photo.jpg")).toEqual([{ url: "/uploads/photo.jpg" }]);
    expect(shareableImages("/uploads/capture.PNG")).toEqual([{ url: "/uploads/capture.PNG" }]);
  });

  test("écarte le SVG, que les réseaux sociaux n'affichent pas, et l'absence d'image", () => {
    expect(shareableImages("/conseils/illustration.svg")).toBeUndefined();
    expect(shareableImages(undefined)).toBeUndefined();
  });
});
