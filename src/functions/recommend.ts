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

  // ---------- Affinity memoization ----------

  const duoCache = new Map<number, number>();
  const trioCache = new Map<string, number>();
  const MAX = 1000;

  function getDuo(a: number, b: number) {
    const key = a < b ? a * MAX + b : b * MAX + a;
    let val = duoCache.get(key);
    if (val === undefined) {
      val = duoAffinity(a, b) ?? 0;
      duoCache.set(key, val);
    }
    return val;
  }

  function getTrio(gp: number, parent: number, child: number) {
    const key = `${gp}|${parent}|${child}`;
    let val = trioCache.get(key);
    if (val === undefined) {
      val = trioAffinity(gp, parent, child) ?? 0;
      trioCache.set(key, val);
    }
    return val;
  }

  function findForChild(
    child: number,
    fixedParents: (number | null)[],
    fixedGps: (number | null)[]
  ): { lineage: LineageCharacters; score: number } | null {

    // -------- Parent pool --------

    const parents: number[] = [];
    for (const id of availableIds) {
      if (id !== child) parents.push(id);
    }

    if (fixedParents[0] != null) parents.push(fixedParents[0]);
    if (fixedParents[1] != null) parents.push(fixedParents[1]);

    const uniqueParents = [...new Set(parents)];

    // -------- Child-parent affinity --------

    const childParentAff: Record<number, number> = {};
    for (const p of uniqueParents) {
      childParentAff[p] = getDuo(child, p);
    }

    // -------- Grandparent pool --------

    const gpPool = [...new Set([
      ...availableIds,
      ...fixedGps.filter(g => g != null)
    ] as number[])];

    // -------- Precompute best two GPs per parent (NO SORT) --------

    const bestHalves = new Map<
      number,
      { gps: [number, number]; scores: [number, number] }
    >();

    for (const p of uniqueParents) {
      let best1Score = -Infinity;
      let best2Score = -Infinity;
      let best1 = -1;
      let best2 = -1;

      for (const gp of gpPool) {
        if (gp === p) continue;

        const score =
          getTrio(gp, p, child) +
          getDuo(p, gp);

        if (score > best1Score) {
          best2Score = best1Score;
          best2 = best1;
          best1Score = score;
          best1 = gp;
        } else if (score > best2Score) {
          best2Score = score;
          best2 = gp;
        }
      }

      if (best2 !== -1) {
        bestHalves.set(p, {
          gps: [best1, best2],
          scores: [best1Score, best2Score]
        });
      }
    }

    function buildHalf(
      parent: number,
      fixed0: number | null,
      fixed1: number | null
    ): { gps: [number, number]; total: number } | null {

      const base = bestHalves.get(parent);
      if (!base) return null;

      const table = base;
      const scores = table.scores;
      const gps = table.gps;

      let gpA: number | null = null;
      let gpB: number | null = null;
      let total = 0;

      // Lock fixed slots
      if (fixed0 != null) {
        if (fixed0 === parent) return null;
        gpA = fixed0;
        total += getTrio(fixed0, parent, child) + getDuo(parent, fixed0);
      }

      if (fixed1 != null) {
        if (fixed1 === parent) return null;
        if (gpA === fixed1) return null;
        gpB = fixed1;
        total += getTrio(fixed1, parent, child) + getDuo(parent, fixed1);
      }

      // Fill missing from precomputed best two
      for (let i = 0; i < 2; i++) {
        const candidate = gps[i];
        const score = scores[i];

        if (candidate === parent) continue;
        if (candidate === gpA || candidate === gpB) continue;

        if (gpA == null) {
          gpA = candidate;
          total += score;
        } else if (gpB == null) {
          gpB = candidate;
          total += score;
        }
      }

      if (gpA == null || gpB == null) return null;

      return { gps: [gpA, gpB], total };
    }

    let bestScore = -Infinity;
    let bestLineage: LineageCharacters | null = null;

    for (const p1 of uniqueParents) {
      if (fixedParents[0] != null && p1 !== fixedParents[0]) continue;

      for (const p2 of uniqueParents) {
        if (p1 === p2) continue;
        if (fixedParents[1] != null && p2 !== fixedParents[1]) continue;

        const half1 = buildHalf(p1, fixedGps[0], fixedGps[1]);
        const half2 = buildHalf(p2, fixedGps[2], fixedGps[3]);

        if (!half1 || !half2) continue;

        const score =
          childParentAff[p1] +
          childParentAff[p2] +
          2 * getDuo(p1, p2) +
          half1.total +
          half2.total;

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

    return bestLineage
      ? { lineage: bestLineage, score: bestScore }
      : null;
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
    if (result && result.score > bestScore) {
      bestScore = result.score;
      bestLineage = result.lineage;
    }
  }

  return bestLineage;
}