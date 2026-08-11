import { Controller, Get } from '@nestjs/common';

import { healthResponseSchema, type HealthResponse } from '@grammar/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return healthResponseSchema.parse({
      status: 'ok',
      service: 'grammar-api',
      version: '10.8.2026',
      timestamp: new Date().toISOString(),
    });
  }
}
