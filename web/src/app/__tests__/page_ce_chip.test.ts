import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "@/app/page";
import {
  ASK_IN_FLIGHT_STATUS,
  ASK_QUESTION_PLACEHOLDER,
  CORPUS_COVERS_CHIP,
  CORPUS_COVERS_SUMMARY,
  DEGRADED_ASK_BANNER,
  DEGRADED_OUTCOME_LABEL,
  HOSTED_CE_OFF_CHIP,
  HOSTED_CE_OFF_LINE,
  HOSTED_CE_SKIP_REASON,
  HOSTED_FREE_TIER_CHIP,
  RETRY_SUMMARY_LABEL,
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

describe("Free-tier Ask UX copy", () => {
  it("exports mastery-first free-tier labels without a user-visible Degraded headline", () => {
    expect(DEGRADED_OUTCOME_LABEL).toBe("Cited excerpts");
    expect(DEGRADED_OUTCOME_LABEL).not.toMatch(/degraded/i);
    expect(DEGRADED_ASK_BANNER).toMatch(/Free Gemini/i);
    expect(DEGRADED_ASK_BANNER).toMatch(/citations intact/i);
    expect(DEGRADED_ASK_BANNER).not.toMatch(/sorry|apolog/i);
    expect(DEGRADED_ASK_BANNER).not.toContain(
      "AI summary temporarily unavailable",
    );
    expect(ASK_IN_FLIGHT_STATUS).toMatch(/free-tier Gemini/i);
    expect(ASK_IN_FLIGHT_STATUS).toMatch(/retries/i);
    expect(ASK_QUESTION_PLACEHOLDER).toBe(
      "e.g. What is the engine displacement of the F20C?",
    );
    expect(HOSTED_FREE_TIER_CHIP).toMatch(/Free-tier Gemini/i);
    expect(RETRY_SUMMARY_LABEL).toBe("Retry summary");
  });

  it("renders free-tier chip and OEM placeholder on the live homepage", () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html).toContain(HOSTED_FREE_TIER_CHIP);
    expect(html).toContain(ASK_QUESTION_PLACEHOLDER);
    expect(html).not.toContain("What is the oil drain plug torque?");
    expect(html).not.toContain(">Degraded<");
    expect(html).not.toMatch(/sorry|apolog/i);
  });

  it("wires degraded UI to Cited excerpts, wait status, and Retry summary", () => {
    const src = readFileSync(resolve(__dirname, "../page.tsx"), "utf8");
    expect(src).toContain("DEGRADED_OUTCOME_LABEL");
    expect(src).toContain("ASK_IN_FLIGHT_STATUS");
    expect(src).toContain("RETRY_SUMMARY_LABEL");
    expect(src).toContain("HOSTED_FREE_TIER_CHIP");
    expect(src).not.toMatch(/>Degraded</);
    expect(src).not.toContain("Ranking evidence and generating answer");
  });
});
