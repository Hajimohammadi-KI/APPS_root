import { Controller, Get } from '@nestjs/common';

import { healthResponseSchema, type HealthResponse } from '@grammar/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return healthResponseSchema.parse({
      status: 'ok',
      service: 'grammar-api',
      version: '20.8.3',
      timestamp: new Date().toISOString(),
    });
  }
}
