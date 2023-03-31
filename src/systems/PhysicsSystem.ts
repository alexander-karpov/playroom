import { Body, Composite, Engine, Vector } from 'matter-js';
import { System, type World } from '@ecs';
import { RigibBody } from '@components/RigibBody';
import { GameObject } from '@components/GameObject';
import { MatterEngine as MatterEngine } from '@components/MatterEngine';

export class PhysicsSystem extends System {
    public override onSync(world: World, deltaS: number): void {
        const deltaMs = deltaS * 1000;
        const physEnvIds = world.select([MatterEngine]);

        for (const id of physEnvIds) {
            const physEnv = world.getComponent(MatterEngine, id);

            Engine.update(physEnv.engine, deltaMs);
        }

        const bodyIds = world.select([RigibBody, GameObject]);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < bodyIds.length; i++) {
            const id = bodyIds[i]!;

            const { body } = world.getComponent(RigibBody, id);
            const { object } = world.getComponent(GameObject, id);

            if (!body.isSleeping && !body.isStatic) {
                object.position.set(body.position.x, body.position.y, 0);
                object.rotation.z = body.angle;
                object.updateMatrix();
            }
        }
    }

    public override onSometimes(world: World): void {
        for (const id of world.select([MatterEngine])) {
            const { engine } = world.getComponent(MatterEngine, id);
            /**
             * Почему-то если засыплять объекты сразу, они просто зависают
             */
            engine.enableSleeping = true;
        }
    }
}
