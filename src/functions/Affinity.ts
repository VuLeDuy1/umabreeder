import relation_members from '../data/succession_relation_member.json';
import relation_values from '../data/succession_relation.json';

interface RelationMember {
    id : number;
    relation_type: number;
    chara_id: number;
}
interface RelationValue {
    relation_point: number;
    relation_type: number;
}

const relationMembers: RelationMember[] = relation_members;
const relationValues: RelationValue[] = relation_values;

const charToRelations = new Map<number, Set<number>>();
for (const rm of relationMembers) {
    if (!charToRelations.has(rm.chara_id)) {
        charToRelations.set(rm.chara_id, new Set());
    }
    charToRelations.get(rm.chara_id)!.add(rm.relation_type);
}

const relationPointMap = new Map<number, number>();
for (const rv of relationValues) {
    relationPointMap.set(rv.relation_type, rv.relation_point);
}

export function duoAffinity(id1: number | null, id2: number | null): number | null{
    if (!id1 || !id2) return null;
    if (id1 === id2) return 0;

    const rel1 = charToRelations.get(id1);
    const rel2 = charToRelations.get(id2);

    if (!rel1 || !rel2) return 0;

    let sum = 0;

    // Iterate over smaller set for efficiency
    const [small, large] =
        rel1.size < rel2.size ? [rel1, rel2] : [rel2, rel1];

    for (const rt of small) {
        if (large.has(rt)) {
            sum += relationPointMap.get(rt) ?? 0;
        }
    }

    return sum;
}

export function trioAffinity(
    id1: number | null,
    id2: number | null,
    id3: number | null
): number | null{
    if (!id1 || !id2 || !id3) return null;
    if (id1 === id2 || id1 === id3 || id2 === id3) return 0;

    const r1 = charToRelations.get(id1);
    const r2 = charToRelations.get(id2);
    const r3 = charToRelations.get(id3);

    if (!r1 || !r2 || !r3) return 0;

    let sum = 0;

    // Iterate smallest first
    const sets = [r1, r2, r3].sort((a, b) => a.size - b.size);
    const [small, mid, large] = sets;

    for (const rt of small) {
        if (mid.has(rt) && large.has(rt)) {
            sum += relationPointMap.get(rt) ?? 0;
        }
    }

    return sum;
}