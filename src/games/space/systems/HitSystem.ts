import { System, type World } from '~/ecs';
import type { Pair } from 'matter-js';
import { type Engine, Events } from 'matter-js';
import { type Body } from 'matter-js';
import { readEntityId } from '../utils/entityHelpers';
import { Ship } from '../components/Ship';
import { Projectile } from '../components/Projectile';
import { Hit } from '../components/Hit';

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
                (world.has(idA, Ship) && world.has(idB, Projectile)) ||
                (world.has(idA, Projectile) && world.has(idB, Ship))
            ) {
                world.has(idA, Hit) ? world.get(idA, Hit) : world.attach(idA, Hit);

                world.has(idB, Hit) ? world.get(idB, Hit) : world.attach(idB, Hit);
            }
        }
    }
}
