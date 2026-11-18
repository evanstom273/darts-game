import { newMatch, playOut, type Match } from '../engine/match';
import { mulberry32 } from '../engine/rng';
import { LEG_HEADER, MATCH_HEADER, legRows, matchRow } from './csv';
import { resolveSetup, type Setup } from './setup';

export interface BatchOptions {
  count: number;
  batchSeed: number;
  perLeg: boolean;
}

export interface BatchResult {
  matchesCsv: string;
  legsCsv: string | null;
  matches: number;
  ms: number;
}

/**
 * Simulate `count` matches. Every match gets its own seed from the batch seed, so the whole batch,
 * or any single match from it, can be reproduced exactly.
 */
export function runBatch(setup: Setup, opts: BatchOptions, onProgress?: (done: number) => boolean | void): BatchResult {
  const t0 = performance.now();
  const rng = mulberry32(opts.batchSeed);
  const matchLines: string[] = [MATCH_HEADER.join(',')];
  const legLines: string[] | null = opts.perLeg ? [LEG_HEADER.join(',')] : null;
  let done = 0;
  for (let i = 1; i <= opts.count; i++) {
    const seed = (rng() * 4294967296) >>> 0;
    const m: Match = newMatch(resolveSetup(setup, rng, seed));
    playOut(m);
    matchLines.push(matchRow(m, i, opts.batchSeed));
    if (legLines) legLines.push(...legRows(m, i));
    done = i;
    if (onProgress && i % 25 === 0 && onProgress(i) === false) break;
  }
  return {
    matchesCsv: matchLines.join('\n') + '\n',
    legsCsv: legLines ? legLines.join('\n') + '\n' : null,
    matches: done,
    ms: performance.now() - t0,
  };
}
