import { Body, Controller, Post, UnprocessableEntityException } from "@nestjs/common";
import { assessmentRequestSchema } from "./assessment.contract";
import { AssessmentService } from "./assessment.service";

@Controller("assessment")
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  assess(@Body() body: unknown) {
    const parsed = assessmentRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: "Invalid assessment request.",
        issues: parsed.error.issues,
      });
    }
    return this.assessmentService.assess(parsed.data);
  }
}
