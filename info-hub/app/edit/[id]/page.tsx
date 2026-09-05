"use client";

import { useParams } from 'next/navigation';
import { NotionEditor } from '@/features/editor/NotionEditor';

export const runtime = 'edge';

export default function EditPage() {
  const params = useParams();
  const id = params?.id as string;

  return <NotionEditor initialId={id} isEditMode={true} />;
}
