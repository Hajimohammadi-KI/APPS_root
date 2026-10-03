import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  AssessmentRequest,
  AssessmentResponse,
  LanguageToolMatch,
} from "./assessment.contract";
import { parseLanguageToolResponse } from "./assessment.contract";

export function applyCorrections(
  text: string,
  matches: LanguageToolMatch[],
): string {
  return parseLanguageToolResponse({ matches }, text)
    .filter((match) => match.replacements[0]?.value !== undefined)
    .toSorted((a, b) => b.offset - a.offset)
    .reduce((corrected, match) => {
      const replacement = match.replacements[0]?.value;
      if (replacement === undefined) return corrected;
      return (
        corrected.slice(0, match.offset) +
        replacement +
        corrected.slice(match.offset + match.length)
      );
    }, text);
}

@Injectable()
export class AssessmentService {
  private readonly endpoint =
    process.env.LANGUAGETOOL_URL ?? "https://api.languagetool.org/v2/check";

  async assess(input: AssessmentRequest): Promise<AssessmentResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: input.text,
          language: input.language,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `LanguageTool returned HTTP ${response.status}.`,
        );
      }

      let matches: LanguageToolMatch[];
      try {
        matches = parseLanguageToolResponse(await response.json(), input.text);
      } catch (error) {
        if (controller.signal.aborted) throw error;
        throw new BadGatewayException(
          "LanguageTool returned an invalid assessment response.",
        );
      }
      const corrected = applyCorrections(input.text, matches);

      return {
        original: input.text,
        corrected,
        changed: corrected !== input.text,
        online: true,
        matches,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      const reason =
        error instanceof Error ? error.message : "Unknown upstream error";
      throw new ServiceUnavailableException(
        `Online assessment is unavailable: ${reason}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
