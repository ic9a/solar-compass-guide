import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoofOrientationIllustration } from "@/components/recommendation/RoofOrientationIllustration";
import { RoofShadingIllustration } from "@/components/recommendation/RoofShadingIllustration";

const orientations = ["south", "south-east", "south-west", "east", "west", "east-west", "north", "unknown"] as const;
const shadings = ["none", "light", "moderate", "severe", "unknown"] as const;

describe("roof guidance illustrations", () => {
  it("renders distinct orientation geometry, including two east-west planes", () => {
    const markup = orientations.map((orientation) => renderToStaticMarkup(
      <RoofOrientationIllustration orientation={orientation} />,
    ));
    expect(new Set(markup).size).toBe(orientations.length);
    const dual = markup[orientations.indexOf("east-west")];
    expect(dual).toContain('data-plane="east"');
    expect(dual).toContain('data-plane="west"');
  });

  it("renders distinct shading geometry with monotonically larger shadow shapes", () => {
    const markup = shadings.map((shading) => renderToStaticMarkup(
      <RoofShadingIllustration shading={shading} />,
    ));
    expect(new Set(markup).size).toBe(shadings.length);
    expect(markup[0]).toContain('data-sunlight="full"');
    expect(markup[2]).toContain('data-obstruction="moderate"');
    expect(markup[3]).toContain('data-obstruction="severe"');
    expect(markup[4]).toContain('data-question="true"');
  });

  it("marks SVGs decorative and exposes selected state to styling", () => {
    const markup = renderToStaticMarkup(<RoofOrientationIllustration orientation="south" selected />);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('focusable="false"');
    expect(markup).toContain('data-selected="true"');
  });
});
