import { ContentUnit } from '@/shared/types';
import { Card, Badge } from '@/shared/ui/components';
import { formatDate } from '@/shared/utils';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS } from '@/shared/utils/translations';
import Link from 'next/link';
import { FileText, BookOpen, GraduationCap, LayoutTemplate, StickyNote } from 'lucide-react';

const typeConfig = {
  NOTE: { icon: StickyNote, color: 'text-amber-500' },
  MATERIAL: { icon: LayoutTemplate, color: 'text-blue-500' },
  ARTICLE: { icon: FileText, color: 'text-emerald-500' },
  LESSON: { icon: GraduationCap, color: 'text-indigo-500' },
  COURSE: { icon: BookOpen, color: 'text-purple-500' }
};

export function ContentCard({ content }: { content: ContentUnit }) {
  const config = typeConfig[content.type];
  const Icon = config.icon;
  
  return (
    <Link href={`/content/${content.id}`}>
      <Card className="h-full flex flex-col group hover:border-emerald-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-stone-50 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">{TYPE_TRANSLATIONS[content.type]}</span>
          </div>
          <Badge variant={content.state === 'READY' ? 'success' : content.state === 'WORKING' ? 'warning' : 'default'}>
            {STATE_TRANSLATIONS[content.state]}
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg text-stone-800 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {content.title}
        </h3>
        
        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-stone-500">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium">{content.maturity}%</span>
            </div>
          </div>
          <time suppressHydrationWarning dateTime={content.updatedAt}>{formatDate(content.updatedAt)}</time>
        </div>
      </Card>
    </Link>
  );
}
