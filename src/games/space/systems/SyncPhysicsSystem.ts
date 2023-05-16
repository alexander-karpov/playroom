import { Engine } from 'matter-js';
import { System, type World } from '~/ecs';
import { RigibBody } from '~/games/space/components/RigibBody';
import { GameObject } from '~/games/space/components/GameObject';
import { writeEntityId } from '~/utils/extraProps';

export class SyncPhysicsSystem extends System {
    public constructor(private readonly engine: Engine) {
        super();
    }

    @System.on([RigibBody])
    private onRigibBody(world: World, id: number) {
        const { body } = world.get(id, RigibBody);
        body.plugin ??= {};
        writeEntityId(body.plugin, id);
    }

    @System.on([RigibBody, GameObject])
    private onRigibBodyGameObject(world: World, entity: number) {
        const { object3d } = world.get(entity, GameObject);
        object3d.matrixAutoUpdate = false;
    }

    @System.onNot([RigibBody, GameObject])
    private onNotRigibBodyGameObject(world: World, entity: number) {
        const { object3d } = world.get(entity, GameObject);
        object3d.matrixAutoUpdate = true;
    }

    public override onOutput(world: World, deltaS: number): void {
        const deltaMs = deltaS * 1000;

        Engine.update(this.engine, deltaMs);

        const bodyIds = world.select([RigibBody, GameObject]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < bodyIds.length; i++) {
            const id = bodyIds[i]!;

            const { body, syncGameObjectRotation: syncRotation } = world.get(id, RigibBody);
            const { object3d: object } = world.get(id, GameObject);

            if (!body.isSleeping && !body.isStatic) {
                object.position.set(body.position.x, body.position.y, object.position.z);

                if (syncRotation) {
                    object.rotation.z = body.angle;
                }

                object.updateMatrix();
            }
        }
    }
}
