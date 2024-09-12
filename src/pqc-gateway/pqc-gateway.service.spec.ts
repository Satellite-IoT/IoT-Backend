import { Test, TestingModule } from '@nestjs/testing';
import { PqcGatewayService } from './pqc-gateway.service';

describe('PqcGatewayService', () => {
  let service: PqcGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PqcGatewayService],
    }).compile();

    service = module.get<PqcGatewayService>(PqcGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
