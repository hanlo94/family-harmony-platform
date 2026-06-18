import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TemplateService', () => {
  let service: TemplateService;

  // ── Mock 数据 ──
  const mockTemplates = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      title: '洗碗',
      description: '用洗洁精认真洗，洗完擦干放回原位',
      difficulty: 2,
      suggestedRepeatRule: 'DAILY',
      needsVerification: false,
      category: '厨房',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date('2026-06-10T10:00:00Z'),
      updatedAt: new Date('2026-06-10T10:00:00Z'),
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
      isActive: true,
      createdAt: new Date('2026-06-10T10:00:00Z'),
      updatedAt: new Date('2026-06-10T10:00:00Z'),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      title: '拖地',
      description: '用拖把把地板拖干净，注意角落和沙发底下',
      difficulty: 3,
      suggestedRepeatRule: 'WEEKLY',
      needsVerification: true,
      category: '清洁',
      sortOrder: 3,
      isActive: true,
      createdAt: new Date('2026-06-10T10:00:00Z'),
      updatedAt: new Date('2026-06-10T10:00:00Z'),
    },
  ];

  // ── Mock PrismaService ──
  const mockPrisma = {
    taskTemplate: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // 模板列表
  // ═══════════════════════════════════════════

  describe('getTemplates', () => {
    it('应该返回所有启用的模板（不过滤分类）', async () => {
      mockPrisma.taskTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.getTemplates({});

      expect(result).toEqual({
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
          {
            id: '00000000-0000-0000-0000-000000000003',
            title: '拖地',
            description: '用拖把把地板拖干净，注意角落和沙发底下',
            difficulty: 3,
            suggestedRepeatRule: 'WEEKLY',
            needsVerification: true,
            category: '清洁',
            sortOrder: 3,
          },
        ],
      });

      expect(mockPrisma.taskTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('应该支持按分类筛选', async () => {
      const kitchenTemplates = mockTemplates.filter((t) => t.category === '厨房');
      mockPrisma.taskTemplate.findMany.mockResolvedValue(kitchenTemplates);

      const result = await service.getTemplates({ category: '厨房' });

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0]!.category).toBe('厨房');
      expect(result.templates[0]!.title).toBe('洗碗');

      expect(mockPrisma.taskTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true, category: '厨房' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('没有匹配的模板时应返回空数组', async () => {
      mockPrisma.taskTemplate.findMany.mockResolvedValue([]);

      const result = await service.getTemplates({ category: '不存在的分类' });

      expect(result).toEqual({ templates: [] });
    });

    it('应按 sortOrder 升序排列', async () => {
      mockPrisma.taskTemplate.findMany.mockResolvedValue(mockTemplates);

      const result = await service.getTemplates({});

      const sortOrders = result.templates.map((t) => t.sortOrder);
      for (let i = 1; i < sortOrders.length; i++) {
        expect(sortOrders[i]!).toBeGreaterThanOrEqual(sortOrders[i - 1]!);
      }
    });
  });
});
