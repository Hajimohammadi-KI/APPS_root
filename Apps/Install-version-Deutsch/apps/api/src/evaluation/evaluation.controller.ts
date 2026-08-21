import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import {
  evaluationRequestSchema,
  type EvaluationResponse,
} from '@grammar/contracts';

import { EvaluationService } from './evaluation.service';

@Controller('evaluate')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post()
  async evaluate(@Body() body: unknown): Promise<EvaluationResponse> {
    const parsed = evaluationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Die Auswertungsanfrage ist ungültig.',
        issues: parsed.error.issues,
      });
    }

    return this.evaluationService.evaluate(parsed.data);
  }
}
