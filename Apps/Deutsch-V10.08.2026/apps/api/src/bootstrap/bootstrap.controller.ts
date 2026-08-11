import { Controller, Get, Inject } from '@nestjs/common';

import type { BootstrapResponse } from '@grammar/contracts';

import { BootstrapService } from './bootstrap.service';

@Controller('bootstrap')
export class BootstrapController {
  constructor(
    @Inject(BootstrapService)
    private readonly bootstrapService: BootstrapService,
  ) {}

  @Get()
  getBootstrap(): BootstrapResponse {
    return this.bootstrapService.getBootstrap();
  }
}
