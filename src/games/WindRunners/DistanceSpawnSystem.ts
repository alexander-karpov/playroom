import { Player } from './Player';
import { RigibBody } from '~/components';
import { Vector } from 'matter-js';
import { SpawnSystem } from './SpawnSystem';

export class DistanceSpawnSystem extends SpawnSystem {
    protected override difficulty(): number {
        return Math.floor(this.distanceFromStart() / 1000);
    }

    private distanceFromStart(): number {
        for (const id of this.world.select([Player, RigibBody])) {
            const { body } = this.world.get(id, RigibBody);

            return Vector.magnitude(body.position);
        }

        return 0;
    }
}
