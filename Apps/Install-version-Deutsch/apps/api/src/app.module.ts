import { Module } from '@nestjs/common';

import { BootstrapController } from './bootstrap/bootstrap.controller';
import { BootstrapService } from './bootstrap/bootstrap.service';
import { EvaluationController } from './evaluation/evaluation.controller';
import { EvaluationService } from './evaluation/evaluation.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [],
  controllers: [HealthController, BootstrapController, EvaluationController],
  providers: [BootstrapService, EvaluationService],
})
export class AppModule {}
