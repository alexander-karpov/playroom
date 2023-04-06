import { Engine } from 'matter-js';
import { System, type World } from '~/ecs';
import { RigibBody } from '~/components/RigibBody';
import { GameObject } from '~/components/GameObject';

export class SyncPhysicsSystem extends System {
    public constructor(private readonly engine: Engine) {
        super();
    }

    public override onOutput(world: World, deltaS: number): void {
        const deltaMs = deltaS * 1000;

        Engine.update(this.engine, deltaMs);

        const bodyIds = world.select([RigibBody, GameObject]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < bodyIds.length; i++) {
            const id = bodyIds[i]!;

            const { body } = world.getComponent(RigibBody, id);
            const { object3d: object } = world.getComponent(GameObject, id);

            if (!body.isSleeping && !body.isStatic) {
                object.position.set(body.position.x, body.position.y, 0);
                object.rotation.z = body.angle;
                object.updateMatrix();
            }
        }
    }
}