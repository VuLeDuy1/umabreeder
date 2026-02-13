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

export function duoAffinity(id1: number | null, id2: number | null): number | null {
    if (!id1 || !id2) return null;
    if (id1 === id2) return 0;
    // Find relations that include both id1 and id2
    const relations1 = relationMembers.filter(rm => rm.chara_id === id1).map(rm => rm.relation_type);
    const relations2 = relationMembers.filter(rm => rm.chara_id === id2).map(rm => rm.relation_type);
    const commonRelations = relations1.filter(rt => relations2.includes(rt));
    const points = commonRelations.map(rt => {
        const rv = relationValues.find(rval => rval.relation_type === rt);
        return rv ? rv.relation_point : 0;
    });
    return points.reduce((a, b) => a + b, 0);
}

export function trioAffinity(id1: number | null, id2: number | null, id3: number | null): number | null {
    if (!id1 || !id2 || !id3) return null;
    if (id1 === id2 || id1 === id3 || id2 === id3) return 0;
    // Find relations that include id1, id2, and id3
    const relations1 = relationMembers.filter(rm => rm.chara_id === id1).map(rm => rm.relation_type);
    const relations2 = relationMembers.filter(rm => rm.chara_id === id2).map(rm => rm.relation_type);
    const relations3 = relationMembers.filter(rm => rm.chara_id === id3).map(rm => rm.relation_type);
    const commonRelations = relations1.filter(rt => relations2.includes(rt) && relations3.includes(rt));
    const points = commonRelations.map(rt => {
        const rv = relationValues.find(rval => rval.relation_type === rt);
        return rv ? rv.relation_point : 0;
    });
    return points.reduce((a, b) => a + b, 0);
}