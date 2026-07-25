import type { EditableFamily } from '@/lib/content-repo';

export type AdminSectionKey = 'cases' | 'insights';

interface AdminSectionMeta {
  singular: string;
  plural: string;
  family: EditableFamily;
  publicBase: string;
}

export const ADMIN_SECTIONS: Record<AdminSectionKey, AdminSectionMeta> = {
  cases: { singular: 'Case', plural: 'Cases', family: 'case', publicBase: '/cases' },
  insights: { singular: 'Insight', plural: 'Insights', family: 'insight', publicBase: '/insights' },
};
