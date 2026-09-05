export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Cloudflare bindings are injected into process.env in Edge runtime
    const db = process.env.infohub_db as any;
    
    if (!db) {
      return NextResponse.json({ 
        error: 'Database binding (infohub_db) not found.',
        info: 'Make sure it is configured in wrangler.toml or CF dashboard.'
      }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    let query = 'SELECT * FROM content_units ORDER BY updated_at DESC';
    let results;

    if (type) {
      const stmt = db.prepare('SELECT * FROM content_units WHERE type = ? ORDER BY updated_at DESC').bind(type);
      const res = await stmt.all();
      results = res.results;
    } else {
      const res = await db.prepare(query).all();
      results = res.results;
    }

    // Parse JSON fields (blocks, topic_ids) since SQLite stores them as strings
    const parsedResults = results.map((row: any) => ({
      ...row,
      blocks: row.blocks ? JSON.parse(row.blocks) : [],
      topicIds: row.topic_ids ? JSON.parse(row.topic_ids) : []
    }));

    return NextResponse.json(parsedResults);
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = process.env.infohub_db as any;
    
    if (!db) {
      return NextResponse.json({ error: 'Database binding not found.' }, { status: 500 });
    }

    const body = await req.json();
    const { id, title, type, state, maturity, topicIds, purpose, visibility, blocks } = body;
    
    const stmt = db.prepare(`
      INSERT INTO content_units (id, title, type, state, maturity, topic_ids, purpose, visibility, blocks, relations, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        type = excluded.type,
        state = excluded.state,
        maturity = excluded.maturity,
        topic_ids = excluded.topic_ids,
        purpose = excluded.purpose,
        visibility = excluded.visibility,
        blocks = excluded.blocks,
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
      JSON.stringify(blocks || [])
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
