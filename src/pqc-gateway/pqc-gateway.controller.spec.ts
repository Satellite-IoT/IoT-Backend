import { Test, TestingModule } from '@nestjs/testing';
import { PqcGatewayController } from './pqc-gateway.controller';

describe('PqcGatewayController', () => {
  let controller: PqcGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PqcGatewayController],
    }).compile();

    controller = module.get<PqcGatewayController>(PqcGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
