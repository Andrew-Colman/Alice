import { HitObject } from '../../beatmap/hitobjects/HitObject';
import { Vector } from '../../utils/Vector';

/**
 * Represents an osu!standard hit object with difficulty calculation values.
 */
export class StandardDiffHitObject extends HitObject {
    /**
     * The strain generated by the hitobject. The first one is speed strain, the second one is aim strain.
     */
    public strains: [number, number] = [0, 0];

    /**
     * The normalized position of the hitobject.
     */
    public normPos: Vector = new Vector({x: 0, y: 0});

    /**
     * The angle created by the hitobject and the previous 2 hitobjects (if present).
     */
    public angle: number|null = 0;

    /**
     *  Whether or not the hitobject is considered as singletap.
     */
    public isSingle: boolean = false;

    /**
     * The time difference between the hitobject and the previous hitobject (if present).
     */
    public deltaTime: number = 0;

    /**
     * The draw distance between the hitobject and the previous hitobject (if present) in osu!pixels.
     */
    public drawDistance: number = 0;

    constructor(obj: HitObject) {
        super(obj);
    }

    toString(): string {
        return `Strains: [${this.strains[0].toFixed(2)}, ${this.strains[1].toFixed(2)}], normpos: [${this.normPos.x.toFixed(2)}, ${this.normPos.y.toFixed(2)}], is_single: ${this.isSingle}`;
    }
}