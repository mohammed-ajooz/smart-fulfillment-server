import { Test, TestingModule } from '@nestjs/testing';
import { DispatcherController } from './dispatcher.controller';

describe('DispatcherController', () => {
  let controller: DispatcherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DispatcherController],
    }).compile();

    controller = module.get<DispatcherController>(DispatcherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
