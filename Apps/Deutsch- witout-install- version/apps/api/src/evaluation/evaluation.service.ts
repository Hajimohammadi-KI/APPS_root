import { Injectable } from '@nestjs/common';

import type { EvaluationRequest, EvaluationResponse } from '@grammar/contracts';
import { evaluationResponseSchema } from '@grammar/contracts';
import { evaluateAnswer, type LanguageToolMatch } from '@grammar/domain';

interface LanguageToolPayload {
  readonly matches?: readonly LanguageToolMatch[];
}

@Injectable()
export class EvaluationService {
  async evaluate(input: EvaluationRequest): Promise<EvaluationResponse> {
    const endpoint =
      process.env.LANGUAGE_TOOL_URL ?? 'https://api.languagetool.org/v2/check';

    try {
      const body = new URLSearchParams({
        text: input.text,
        language: 'de-DE',
      });
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(`LanguageTool antwortet mit HTTP ${response.status}.`);
      }

      const payload = (await response.json()) as LanguageToolPayload;
      return evaluationResponseSchema.parse(
        evaluateAnswer(
          input.text,
          input.grammar,
          input.kind,
          {
            matches: payload.matches ?? [],
            online: true,
          },
          input.taskPrompt,
        ),
      );
    } catch (error) {
      return evaluationResponseSchema.parse(
        evaluateAnswer(
          input.text,
          input.grammar,
          input.kind,
          {
            matches: [],
            online: false,
            networkError:
              error instanceof Error
                ? error.message
                : 'LanguageTool ist momentan nicht erreichbar.',
          },
          input.taskPrompt,
        ),
      );
    }
  }
}
