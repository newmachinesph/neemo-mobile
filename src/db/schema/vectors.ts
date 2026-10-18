/**
 * sqlite-vec virtual table definitions.
 * These are NOT managed by Drizzle ORM — they use raw SQL
 * because sqlite-vec uses custom virtual table syntax.
 *
 * Requires: `sqlite-vec` extension loaded via op-sqlite's loadExtension().
 * Install when ready: `npm install sqlite-vec`
 *
 * Embedding dimension: 384 (MiniLM-L6-v2 / all-MiniLM-L6-v2)
 */

export const VECTOR_TABLES_SQL = [
  // Merchant embeddings for smart categorization
  `CREATE VIRTUAL TABLE IF NOT EXISTS vec_merchants USING vec0(
    merchant_name TEXT,
    embedding FLOAT[384]
  )`,

  // Transaction embeddings for semantic search
  `CREATE VIRTUAL TABLE IF NOT EXISTS vec_transactions USING vec0(
    transaction_id TEXT,
    embedding FLOAT[384]
  )`,

  // Chat context memory for AI assistant
  `CREATE VIRTUAL TABLE IF NOT EXISTS vec_chat_context USING vec0(
    context_id TEXT,
    embedding FLOAT[384],
    content TEXT,
    created_at TEXT
  )`,
] as const;
