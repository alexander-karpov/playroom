import { System, type World } from '~/ecs';
import type { Pair } from 'matter-js';
import { type Engine, Events } from 'matter-js';
import { type Body } from 'matter-js';
import { readEntityId } from '~/utils/extraProps';
import { Ship } from './Ship';
import { Projectile } from './Projectile';
import { Hit } from './Hit';

export class HitSystem extends System {
    public constructor(private readonly world: World, private readonly engine: Engine) {
        super();

        Events.on(this.engine, 'collisionStart', this.handleCollisions.bind(this, world));
    }

    private handleCollisions(world: World, event: { pairs: Pair[] }) {
        for (const pair of event.pairs) {
            this.handleProjectileShipHit(world, pair);
        }
    }

    private handleProjectileShipHit(world: World, { bodyA, bodyB }: Pair) {
        let shipBody: Body | undefined;
        let projectileBody: Body | undefined;

        const idA = readEntityId<number>(bodyA.plugin);
        const idB = readEntityId<number>(bodyB.plugin);

        if (idA != null && idB != null) {
            if (
                (world.has(Ship, idA) && world.has(Projectile, idB)) ||
                (world.has(Projectile, idA) && world.has(Ship, idB))
            ) {
                world.has(Hit, idA) ? world.get(idA, Hit) : world.attach(idA, Hit);

                world.has(Hit, idB) ? world.get(idB, Hit) : world.attach(idB, Hit);
            }
        }
    }
}
