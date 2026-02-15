import { TYPE_PREFIX } from '../config.js';

/**
 * Generate next QID for a given type.
 * Format: PREFIX_YEAR_SEQNUM (e.g., IC_2025_0001)
 */
export function generateQid(existingQuotes, quoteType) {
  const prefix = TYPE_PREFIX[quoteType];
  if (!prefix) throw new Error(`Unknown quote type: ${quoteType}`);

  const year = new Date().getFullYear().toString();
  const pattern = `${prefix}_${year}_`;

  const matchingSeqs = existingQuotes
    .filter(q => q.qid && q.qid.startsWith(pattern))
    .map(q => {
      const match = q.qid.match(/_(\d{4})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextSeq = matchingSeqs.length > 0 ? Math.max(...matchingSeqs) + 1 : 1;
  return `${prefix}_${year}_${nextSeq.toString().padStart(4, '0')}`;
}
