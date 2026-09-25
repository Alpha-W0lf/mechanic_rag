import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import {
  CORPUS_COVERS_CHIP,
  CORPUS_COVERS_SUMMARY,
  HOSTED_CE_OFF_CHIP,
  HOSTED_CE_OFF_LINE,
  HOSTED_CE_SKIP_REASON,
} from "@/lib/ask_copy";

describe('JH-48.7: Live UI "CE off on hosted" chip', () => {
  it("exports valid copy adhering to the hosted-honest contract", () => {
    expect(HOSTED_CE_OFF_CHIP).toBe("CE off on hosted");
    expect(HOSTED_CE_SKIP_REASON).toBe("ce_skip_reason=hosted_ce_disabled");
    expect(HOSTED_CE_OFF_LINE).toContain("Hosted cross-encoder is off");
    expect(HOSTED_CE_OFF_LINE).toContain("ce_skip_reason=hosted_ce_disabled");
    // Honesty constraint: never claim CE lift
    expect(HOSTED_CE_OFF_LINE).not.toMatch(/lift/i);
  });

  it('renders "CE off on hosted" chip and copy in live homepage static HTML markup', () => {
    const html = renderToStaticMarkup(React.createElement(Home));

    // Chip element and copy in live HTML
    expect(html).toContain(HOSTED_CE_OFF_CHIP);
    expect(html).toContain("CE off on hosted");
    expect(html).toContain(HOSTED_CE_SKIP_REASON);
    expect(html).toContain("ce_skip_reason=hosted_ce_disabled");
    expect(html).toContain(HOSTED_CE_OFF_LINE);
    expect(html).toContain("Hosted cross-encoder is off");

    // Muted styling classes for the chip
    expect(html).toContain("font-mono");
    expect(html).toContain("text-ink-muted");

    // Constraint verification: no fabricated lift claim in rendered output
    expect(html).not.toMatch(/ce lift/i);
    expect(html).not.toMatch(/cross-encoder lift/i);
  });

  it('exports valid copy for JH-73 Corpus covers chip', () => {
    expect(CORPUS_COVERS_CHIP).toBe("Corpus covers");
    expect(CORPUS_COVERS_SUMMARY).toContain("Honda S2000 service manual");
    expect(CORPUS_COVERS_SUMMARY).not.toMatch(/risk/i);
    expect(CORPUS_COVERS_SUMMARY).not.toMatch(/copyright/i);
  });
});
