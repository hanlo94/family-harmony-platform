import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('TemplateController', () => {
  let controller: TemplateController;

  // ── Mock 数据 ──
  const mockTemplateResponse = {
    templates: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: '洗碗',
        description: '用洗洁精认真洗，洗完擦干放回原位',
        difficulty: 2,
        suggestedRepeatRule: 'DAILY',
        needsVerification: false,
        category: '厨房',
        sortOrder: 1,
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        title: '倒垃圾',
        description: '把家里所有垃圾桶的垃圾收集起来，换上新的垃圾袋',
        difficulty: 1,
        suggestedRepeatRule: 'DAILY',
        needsVerification: false,
        category: '清洁',
        sortOrder: 2,
      },
    ],
  };

  const mockKitchenTemplateResponse = {
    templates: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: '洗碗',
        description: '用洗洁精认真洗，洗完擦干放回原位',
        difficulty: 2,
        suggestedRepeatRule: 'DAILY',
        needsVerification: false,
        category: '厨房',
        sortOrder: 1,
      },
    ],
  };

  // ── Mock TemplateService ──
  const mockTemplateService = {
    getTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [{ provide: TemplateService, useValue: mockTemplateService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TemplateController>(TemplateController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 模板列表
  // ═══════════════════════════════════════════

  describe('getTemplates', () => {
    it('应该调用 templateService.getTemplates 并返回模板列表', async () => {
      mockTemplateService.getTemplates.mockResolvedValue(mockTemplateResponse);

      const result = await controller.getTemplates({});

      expect(mockTemplateService.getTemplates).toHaveBeenCalledWith({});
      expect(result).toEqual(mockTemplateResponse);
    });

    it('应该将 category 查询参数传递给 service', async () => {
      mockTemplateService.getTemplates.mockResolvedValue(mockKitchenTemplateResponse);

      const result = await controller.getTemplates({ category: '厨房' });

      expect(mockTemplateService.getTemplates).toHaveBeenCalledWith({ category: '厨房' });
      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.category).toBe('厨房');
    });

    it('不传 category 时应返回全部模板', async () => {
      mockTemplateService.getTemplates.mockResolvedValue(mockTemplateResponse);

      const result = await controller.getTemplates({});

      expect(mockTemplateService.getTemplates).toHaveBeenCalledWith({});
      expect(result.templates).toHaveLength(2);
    });
  });
});
