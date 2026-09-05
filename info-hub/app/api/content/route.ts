export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareD1 } from '@/shared/utils/cloudflare-bindings';

export async function GET(req: NextRequest) {
  try {
    const db = getCloudflareD1();
    
    if (!db) {
      return NextResponse.json({ 
        error: 'Database binding (infohub_db_v2 or infohub_db) not detected.',
        details: 'Ensure D1 Database binding is added in Cloudflare Dashboard (Pages/Worker -> Settings -> Bindings) or wrangler.toml'
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    let results;

    if (type) {
      const stmt = db.prepare('SELECT * FROM content_units WHERE type = ? ORDER BY updated_at DESC').bind(type);
      const res = await stmt.all();
      results = res.results || [];
    } else {
      const res = await db.prepare('SELECT * FROM content_units ORDER BY updated_at DESC').all();
      results = res.results || [];
    }

    // Parse JSON fields (blocks, topic_ids, modules, relations) since SQLite stores them as strings
    const parsedResults = results.map((row: any) => ({
      ...row,
      topicIds: row.topic_ids ? (typeof row.topic_ids === 'string' ? JSON.parse(row.topic_ids) : row.topic_ids) : [],
      blocks: row.blocks ? (typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks) : [],
      relations: row.relations ? (typeof row.relations === 'string' ? JSON.parse(row.relations) : row.relations) : [],
      modules: row.modules ? (typeof row.modules === 'string' ? JSON.parse(row.modules) : row.modules) : undefined,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json(parsedResults);
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getCloudflareD1();
    
    if (!db) {
      return NextResponse.json({ 
        error: 'Database binding (infohub_db_v2 or infohub_db) not detected.',
        details: 'Ensure D1 Database binding is added in Cloudflare Dashboard (Pages/Worker -> Settings -> Bindings) or wrangler.toml'
      }, { status: 503 });
    }

    const body = await req.json();
    const { id, title, type, state, maturity, topicIds, purpose, visibility, blocks, relations, modules, authorId } = body;
    
    const stmt = db.prepare(`
      INSERT INTO content_units (id, title, type, state, maturity, topic_ids, purpose, visibility, blocks, relations, modules, author_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        type = excluded.type,
        state = excluded.state,
        maturity = excluded.maturity,
        topic_ids = excluded.topic_ids,
        purpose = excluded.purpose,
        visibility = excluded.visibility,
        blocks = excluded.blocks,
        relations = excluded.relations,
        modules = excluded.modules,
        author_id = excluded.author_id,
        updated_at = CURRENT_TIMESTAMP
    `);

    await stmt.bind(
      id, 
      title, 
      type || 'NOTE', 
      state || 'DRAFT', 
      maturity || 0, 
      JSON.stringify(topicIds || []), 
      purpose || 'PERSONAL', 
      visibility || 'PRIVATE', 
      JSON.stringify(blocks || []),
      JSON.stringify(relations || []),
      modules ? JSON.stringify(modules) : null,
      authorId || null
    ).run();

    return NextResponse.json({
      status: 'ok',
      message: 'Saved successfully',
      id
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getCloudflareD1();
    if (!db) {
      return NextResponse.json({ 
        error: 'Database binding (infohub_db_v2 or infohub_db) not detected.',
        details: 'Ensure D1 Database binding is added in Cloudflare Dashboard (Pages/Worker -> Settings -> Bindings) or wrangler.toml'
      }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.prepare('DELETE FROM content_units WHERE id = ?').bind(id).run();
    return NextResponse.json({ status: 'ok', deleted: id });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
