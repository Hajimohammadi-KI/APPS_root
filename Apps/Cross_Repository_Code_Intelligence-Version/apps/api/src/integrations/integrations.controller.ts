import { Controller, Get } from "@nestjs/common";
import type { CapabilityResponse } from "@cross-repo/contracts";
import { IntegrationsService } from "./integrations.service.js";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get("capabilities")
  capabilities(): CapabilityResponse {
    return this.integrations.capabilities();
  }
}
