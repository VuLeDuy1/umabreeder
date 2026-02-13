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
    if (!a || !b) return 0;

    if (c === undefined) {
      return duoAffinity(a, b) || 0;
    }

    if (!c) return 0;
    return trioAffinity(c, b, a) || 0;
  }

  function findForChild(
    lineageIds: (number | null)[]
  ): LineageCharacters | null {
    const child = lineageIds[0]!;
    const fixedParents = lineageIds.slice(1, 3);
    const fixedGps = lineageIds.slice(3, 7);

    const parentPool = new Set(
      [...availableIds, ...fixedParents.filter(Boolean)] as number[]
    );
    parentPool.delete(child);

    const gpPool = new Set(
      [...availableIds, ...fixedGps.filter(Boolean)] as number[]
    );

    const p1Set = fixedParents[0]
      ? new Set([fixedParents[0]])
      : parentPool;

    const p2Set = fixedParents[1]
      ? new Set([fixedParents[1]])
      : parentPool;

    const affToChild = new Map<number, number>();
    for (const p of new Set([...p1Set, ...p2Set])) {
      affToChild.set(p, getAffinity(child, p));
    }

    function gpScore(c: number, p: number, gp: number) {
      return getAffinity(c, p, gp) + getAffinity(p, gp);
    }

    const bestHalves = new Map<
      number,
      { scores: number[]; gps: number[] }
    >();

    for (const p of new Set([...p1Set, ...p2Set])) {
      const scores: { score: number; gp: number }[] = [];

      for (const gp of gpPool) {
        if (gp === p) continue;
        scores.push({
          score: gpScore(child, p, gp),
          gp
        });
      }

      scores.sort((a, b) => b.score - a.score);

      if (scores.length >= 2) {
        bestHalves.set(p, {
          scores: [scores[0].score, scores[1].score],
          gps: [scores[0].gp, scores[1].gp]
        });
      }
    }

    let bestScore = -Infinity;
    let bestLineage: LineageCharacters | null = null;

    for (const p1 of p1Set) {
      for (const p2 of p2Set) {
        if (p1 === p2) continue;

        const half1 = bestHalves.get(p1);
        const half2 = bestHalves.get(p2);
        if (!half1 || !half2) continue;

        const score =
          (affToChild.get(p1) || 0) +
          (affToChild.get(p2) || 0) +
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

    return bestLineage;
  }

  // Child fixed
  if (lineageIds[0]) {
    return findForChild(lineageIds);
  }

  // Child not fixed
  let bestScore = -Infinity;
  let bestLineage: LineageCharacters | null = null;

  for (const c of availableIds) {
    const result = findForChild([c, ...lineageIds.slice(1)]);
    if (!result) continue;

    // We still need score comparison internally,
    // so re-evaluate using same logic
    const temp = findForChild([c, ...lineageIds.slice(1)]);
    if (!temp) continue;

    const score =
      getAffinity(temp.p1, temp.child) +
      getAffinity(temp.p2, temp.child) +
      2 * getAffinity(temp.p1, temp.p2) +
      getAffinity(temp.child, temp.p1, temp.gp1) +
      getAffinity(temp.child, temp.p1, temp.gp2) +
      getAffinity(temp.child, temp.p2, temp.gp3) +
      getAffinity(temp.child, temp.p2, temp.gp4);

    if (score > bestScore) {
      bestScore = score;
      bestLineage = temp;
    }
  }

  return bestLineage;
}
