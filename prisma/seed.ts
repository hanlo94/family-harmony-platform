import { PrismaClient, MemberRole, TaskStatus, RepeatRule } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 数据库种子数据
 *
 * 包含：
 * 1. 内置任务模板（9 个常见家务模板）
 * 2. 测试用户（3 个家庭成员）
 * 3. 测试家庭（1 个）
 * 4. 家庭成员关系
 * 5. 示例任务（覆盖各状态）
 */
async function main() {
  console.log('🌱 开始填充种子数据...\n');

  // ═══════════════════════════════════════════
  // 1. 内置任务模板
  // ═══════════════════════════════════════════
  console.log('📋 填充任务模板...');

  const templates = await Promise.all([
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        title: '洗碗',
        description: '用洗洁精认真洗，洗完擦干放回原位',
        difficulty: 2,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: false,
        category: '厨房',
        sortOrder: 1,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        title: '倒垃圾',
        description: '把家里所有垃圾桶的垃圾收集起来，换上新的垃圾袋',
        difficulty: 1,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: false,
        category: '清洁',
        sortOrder: 2,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        title: '拖地',
        description: '用拖把把地板拖干净，注意角落和沙发底下',
        difficulty: 3,
        suggestedRepeatRule: RepeatRule.WEEKLY,
        needsVerification: true,
        category: '清洁',
        sortOrder: 3,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000004',
        title: '洗衣服',
        description: '把脏衣服分类放入洗衣机，洗完晾晒',
        difficulty: 2,
        suggestedRepeatRule: RepeatRule.WEEKLY,
        needsVerification: false,
        category: '洗衣',
        sortOrder: 4,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000005',
        title: '整理房间',
        description: '把房间里的东西归位，整理床铺，清理杂物',
        difficulty: 2,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: true,
        category: '整理',
        sortOrder: 5,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000006' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000006',
        title: '擦桌子',
        description: '用餐后擦干净餐桌，包括桌面和椅子',
        difficulty: 1,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: false,
        category: '厨房',
        sortOrder: 6,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000007' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000007',
        title: '做饭',
        description: '负责准备全家一顿饭，包括备菜和烹饪',
        difficulty: 4,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: false,
        category: '厨房',
        sortOrder: 7,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000008' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000008',
        title: '遛狗',
        description: '带狗狗出去散步至少30分钟，记得带垃圾袋',
        difficulty: 2,
        suggestedRepeatRule: RepeatRule.DAILY,
        needsVerification: false,
        category: '宠物',
        sortOrder: 8,
      },
    }),
    prisma.taskTemplate.upsert({
      where: { id: '00000000-0000-0000-0000-000000000009' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000009',
        title: '浇花',
        description: '给家里所有植物浇水，注意不同植物需要的水量不同',
        difficulty: 1,
        suggestedRepeatRule: RepeatRule.WEEKLY,
        needsVerification: false,
        category: '其他',
        sortOrder: 9,
      },
    }),
  ]);

  console.log(`  ✅ ${templates.length} 个任务模板已创建\n`);

  // ═══════════════════════════════════════════
  // 2. 测试用户
  // ═══════════════════════════════════════════
  console.log('👤 填充测试用户...');

  const user1 = await prisma.user.upsert({
    where: { wechatOpenid: 'test_openid_user1' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      wechatOpenid: 'test_openid_user1',
      wechatUnionid: 'test_unionid_user1',
      nickname: '爸爸',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=dad',
    },
  });
  const user2 = await prisma.user.upsert({
    where: { wechatOpenid: 'test_openid_user2' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      wechatOpenid: 'test_openid_user2',
      wechatUnionid: 'test_unionid_user2',
      nickname: '妈妈',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mom',
    },
  });
  const user3 = await prisma.user.upsert({
    where: { wechatOpenid: 'test_openid_user3' },
    update: {},
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      wechatOpenid: 'test_openid_user3',
      wechatUnionid: 'test_unionid_user3',
      nickname: '小明',
      avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kid',
    },
  });

  console.log(`  ✅ 3 个测试用户已创建\n`);

  // ═══════════════════════════════════════════
  // 3. 测试家庭
  // ═══════════════════════════════════════════
  console.log('🏠 填充测试家庭...');

  const family = await prisma.family.upsert({
    where: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    update: {},
    create: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: '幸福的三口之家',
      createdBy: user1.id,
      inviteCode: 'ABC123',
    },
  });

  console.log(`  ✅ 家庭「${family.name}」已创建（邀请码: ${family.inviteCode}）\n`);

  // ═══════════════════════════════════════════
  // 4. 家庭成员关系
  // ═══════════════════════════════════════════
  console.log('👥 填充家庭成员...');

  const member1 = await prisma.familyMember.upsert({
    where: {
      familyId_userId: {
        familyId: family.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      familyId: family.id,
      userId: user1.id,
      role: MemberRole.ORGANIZER,
      reminderEnabled: true,
    },
  });
  const member2 = await prisma.familyMember.upsert({
    where: {
      familyId_userId: {
        familyId: family.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      familyId: family.id,
      userId: user2.id,
      role: MemberRole.MEMBER,
      reminderEnabled: true,
    },
  });
  const member3 = await prisma.familyMember.upsert({
    where: {
      familyId_userId: {
        familyId: family.id,
        userId: user3.id,
      },
    },
    update: {},
    create: {
      familyId: family.id,
      userId: user3.id,
      role: MemberRole.CHILD,
      reminderEnabled: false,
    },
  });

  console.log(`  ✅ 3 个家庭成员已创建（爸爸-组织者，妈妈-成员，小明-孩子）\n`);

  // ═══════════════════════════════════════════
  // 5. 示例任务（覆盖各状态）
  // ═══════════════════════════════════════════
  console.log('📝 填充示例任务...');

  const now = new Date();

  // 待完成的任务（分配给小明，2小时后到期）
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '整理自己的书桌',
      description: '把课本、文具和课外书归位，擦干净桌面',
      difficulty: 2,
      deadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2小时后
      status: TaskStatus.PENDING_COMPLETION,
      repeatRule: RepeatRule.DAILY,
      needsVerification: true,
      createdBy: user1.id,
      assignedTo: user3.id,
    },
  });

  // 临近到期的任务（30分钟后到期）
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '倒垃圾',
      description: '厨房和客厅的垃圾桶都满了，赶快去倒',
      difficulty: 1,
      deadline: new Date(now.getTime() + 30 * 60 * 1000), // 30分钟后
      status: TaskStatus.PENDING_COMPLETION,
      repeatRule: RepeatRule.DAILY,
      needsVerification: false,
      createdBy: user2.id,
      assignedTo: user3.id,
    },
  });

  // 已逾期的任务
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '洗碗',
      description: '午餐后的碗筷还没洗',
      difficulty: 2,
      deadline: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2小时前
      status: TaskStatus.PENDING_COMPLETION,
      repeatRule: RepeatRule.DAILY,
      needsVerification: false,
      createdBy: user2.id,
      assignedTo: user1.id,
    },
  });

  // 待验收的任务
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '拖地',
      description: '全屋地板拖干净',
      difficulty: 3,
      deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: TaskStatus.PENDING_VERIFICATION,
      repeatRule: RepeatRule.WEEKLY,
      needsVerification: true,
      createdBy: user1.id,
      assignedTo: user2.id,
      completedAt: new Date(now.getTime() - 30 * 60 * 1000),
      completionNote: '客厅和卧室都拖过了，厨房油污有点重多拖了两遍',
    },
  });

  // 已完成的任务
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '浇花',
      description: '阳台的花需要浇水了',
      difficulty: 1,
      deadline: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      status: TaskStatus.COMPLETED,
      repeatRule: RepeatRule.WEEKLY,
      needsVerification: false,
      createdBy: user2.id,
      assignedTo: user3.id,
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      completionNote: '全部浇完了',
      verifiedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      verifiedBy: user1.id,
    },
  });

  // 已驳回的任务
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '洗衣服',
      description: '把脏衣篮里的衣服洗了',
      difficulty: 2,
      deadline: new Date(now.getTime() + 5 * 60 * 60 * 1000),
      status: TaskStatus.REJECTED,
      repeatRule: RepeatRule.WEEKLY,
      needsVerification: true,
      createdBy: user2.id,
      assignedTo: user3.id,
      completedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      completionNote: '洗完了',
      rejectionReason: '深色和浅色衣服没有分开洗，白色T恤染了颜色，请重新分类再洗',
    },
  });

  // 已取消的任务
  await prisma.task.create({
    data: {
      familyId: family.id,
      title: '遛狗',
      description: '带旺财出去遛一圈',
      difficulty: 2,
      deadline: new Date(now.getTime() + 3 * 60 * 60 * 1000),
      status: TaskStatus.CANCELLED,
      repeatRule: RepeatRule.DAILY,
      needsVerification: false,
      createdBy: user1.id,
      assignedTo: user1.id,
      cancelledAt: new Date(now.getTime() - 30 * 60 * 1000),
      cancelledBy: user1.id,
      cancelledReason: '今天下雨，改成在家里和狗狗玩飞盘',
    },
  });

  console.log('  ✅ 7 个示例任务已创建（覆盖全部 5 种状态 + 2 种计算状态）\n');

  // ═══════════════════════════════════════════
  // 6. 示例邀请码
  // ═══════════════════════════════════════════
  console.log('📨 填充示例邀请...');

  await prisma.invitation.create({
    data: {
      familyId: family.id,
      code: 'WELCOME',
      createdBy: user1.id,
      expiresAt: new Date(now.getTime() + 72 * 60 * 60 * 1000), // 72小时后过期
      isActive: true,
    },
  });

  console.log('  ✅ 1 个邀请码已创建\n');

  console.log('═══════════════════════════════════════════');
  console.log('🎉 种子数据填充完成！');
  console.log('═══════════════════════════════════════════\n');
  console.log('📊 数据概要：');
  console.log('   - 任务模板：9 个');
  console.log('   - 用户：3 个');
  console.log('   - 家庭：1 个');
  console.log('   - 家庭成员：3 个');
  console.log('   - 任务：7 个（覆盖 PENDING_COMPLETION / PENDING_VERIFICATION / REJECTED / COMPLETED / CANCELLED）');
  console.log('   - 邀请码：1 个\n');
  console.log('💡 提示：');
  console.log('   - 组织者（爸爸）OpenID: test_openid_user1');
  console.log('   - 成员（妈妈）OpenID:   test_openid_user2');
  console.log('   - 孩子（小明）OpenID:   test_openid_user3');
  console.log('   - 家庭邀请码:            ABC123');
  console.log('   - 邀请码（备用）:        WELCOME\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 种子数据填充失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
