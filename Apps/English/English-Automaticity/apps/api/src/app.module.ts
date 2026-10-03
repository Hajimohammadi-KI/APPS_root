import { Module } from "@nestjs/common";
import { AssessmentModule } from "./assessment/assessment.module";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  imports: [AssessmentModule],
})
export class AppModule {}
