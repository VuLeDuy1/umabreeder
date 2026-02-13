export interface LineageCharacters {
  child: number;
  p1: number;
  p2: number;
  gp1: number;
  gp2: number;
  gp3: number;
  gp4: number;
}

export interface AffinityFunctions {
  duoAffinity: (a: number, b: number) => number | null | undefined;
  trioAffinity: (
    gp: number,
    parent: number,
    child: number
  ) => number | null | undefined;
}

export function findOptimalLineage(
  lineageIds: (number | null)[],
  availableIds: number[],
  affinity: AffinityFunctions
): LineageCharacters | null {
  if (!lineageIds || lineageIds.length !== 7) return null;

  const { duoAffinity, trioAffinity } = affinity;

  function getAffinity(
    a: number | null,
    b: number | null,
    c?: number | null
  ): number {
    if (a == null || b == null) return 0;
    if (c === undefined) return duoAffinity(a, b) ?? 0;
    if (c == null) return 0;
    return trioAffinity(c, b, a) ?? 0;
  }

  function findForChild(
    child: number,
    fixedParents: (number | null)[],
    fixedGps: (number | null)[]
  ): { lineage: LineageCharacters; score: number } | null {
    const parentPool = new Set([
      ...availableIds,
      ...fixedParents.filter(p => p != null)
    ] as number[]);
    parentPool.delete(child);

    const gpPool = new Set([
      ...availableIds,
      ...fixedGps.filter(g => g != null)
    ] as number[]);

    const p1Set = fixedParents[0] != null
      ? new Set([fixedParents[0]])
      : parentPool;

    const p2Set = fixedParents[1] != null
      ? new Set([fixedParents[1]])
      : parentPool;

    const parentCandidates = new Set([...p1Set, ...p2Set]);

    const affToChild = new Map<number, number>();
    for (const p of parentCandidates) {
      affToChild.set(p, getAffinity(child, p));
    }

    function gpScore(p: number, gp: number) {
      return getAffinity(child, p, gp) + getAffinity(p, gp);
    }

    // Precompute best 2 grandparents per parent
    const bestHalves = new Map<
      number,
      { gps: number[]; scores: number[] }
    >();

    for (const p of parentCandidates) {
      const scored: { gp: number; score: number }[] = [];

      for (const gp of gpPool) {
        if (gp === p) continue;
        scored.push({ gp, score: gpScore(p, gp) });
      }

      scored.sort((a, b) => b.score - a.score);

      if (scored.length >= 2) {
        bestHalves.set(p, {
          gps: [scored[0].gp, scored[1].gp],
          scores: [scored[0].score, scored[1].score]
        });
      }
    }

function buildHalf(
  parent: number,
  base: { gps: number[]; scores: number[] } | undefined,
  fixedSlot0: number | null,
  fixedSlot1: number | null
): { gps: number[]; scores: number[] } | null {
  if (!base) return null;

  const gps: (number | null)[] = [null, null];
  const scores: number[] = [0, 0];

  // Lock fixed slots
  if (fixedSlot0 != null) {
    if (fixedSlot0 === parent) return null;
    gps[0] = fixedSlot0;
    scores[0] = gpScore(parent, fixedSlot0);
  }

  if (fixedSlot1 != null) {
    if (fixedSlot1 === parent) return null;
    gps[1] = fixedSlot1;
    scores[1] = gpScore(parent, fixedSlot1);
  }

  // Prevent fixed duplication
  if (
    gps[0] != null &&
    gps[1] != null &&
    gps[0] === gps[1]
  ) {
    return null;
  }

  // Fill empty slots from bestHalves
  for (let i = 0; i < 2; i++) {
    if (gps[i] != null) continue;

    for (let j = 0; j < base.gps.length; j++) {
      const candidate = base.gps[j];

      if (candidate === parent) continue;
      if (gps.includes(candidate)) continue;

      gps[i] = candidate;
      scores[i] = base.scores[j];
      break;
    }

    if (gps[i] == null) return null; // couldn't fill slot
  }

  return {
    gps: gps as number[],
    scores
  };
}

    let bestScore = -Infinity;
    let bestLineage: LineageCharacters | null = null;

    for (const p1 of p1Set) {
      for (const p2 of p2Set) {
        if (p1 === p2) continue;

        const half1 = buildHalf(
          p1,
          bestHalves.get(p1),
          fixedGps[0],
          fixedGps[1]
        );

        const half2 = buildHalf(
          p2,
          bestHalves.get(p2),
          fixedGps[2],
          fixedGps[3]
        );

        if (!half1 || !half2) continue;

        const score =
          (affToChild.get(p1) ?? 0) +
          (affToChild.get(p2) ?? 0) +
          2 * getAffinity(p1, p2) +
          half1.scores[0] +
          half1.scores[1] +
          half2.scores[0] +
          half2.scores[1];

        if (score > bestScore) {
          bestScore = score;
          bestLineage = {
            child,
            p1,
            p2,
            gp1: half1.gps[0],
            gp2: half1.gps[1],
            gp3: half2.gps[0],
            gp4: half2.gps[1]
          };
        }
      }
    }

    return bestLineage ? { lineage: bestLineage, score: bestScore } : null;
  }

  const fixedChild = lineageIds[0];
  const fixedParents = lineageIds.slice(1, 3);
  const fixedGps = lineageIds.slice(3, 7);

  if (fixedChild != null) {
    return findForChild(fixedChild, fixedParents, fixedGps)?.lineage ?? null;
  }

  let bestScore = -Infinity;
  let bestLineage: LineageCharacters | null = null;

  for (const c of availableIds) {
    const result = findForChild(c, fixedParents, fixedGps);
    if (!result) continue;

    if (result.score > bestScore) {
      bestScore = result.score;
      bestLineage = result.lineage;
    }
  }

  return bestLineage;
}
