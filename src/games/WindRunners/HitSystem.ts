import { System, type World } from '~/ecs';
import type { Pair } from 'matter-js';
import { type Engine, Events } from 'matter-js';
import { type Body } from 'matter-js';
import { readEntityId } from '~/utils/extraProps';
import { Ship } from './Ship';
import { Projectile } from './Projectile';
import { Hit } from './Hit';

export class HitSystem extends System {
    public constructor(private readonly engine: Engine) {
        super();
    }

    public override onCreate(world: World): void {
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

        const idA = readEntityId(bodyA.plugin);
        const idB = readEntityId(bodyB.plugin);

        if (idA != null && idB != null) {
            if (
                (world.hasComponent(Ship, idA) && world.hasComponent(Projectile, idB)) ||
                (world.hasComponent(Projectile, idA) && world.hasComponent(Ship, idB))
            ) {
                world.hasComponent(Hit, idA)
                    ? world.getComponent(Hit, idA)
                    : world.addComponent(Hit, idA);

                world.hasComponent(Hit, idB)
                    ? world.getComponent(Hit, idB)
                    : world.addComponent(Hit, idB);
            }
        }
    }
}
