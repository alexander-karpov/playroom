import { Body, Composite, Engine, Vector } from 'matter-js';
import { System, type World } from '~/ecs';
import { RigibBody } from '~/components/RigibBody';
import { GameObject } from '~/components/GameObject';

export class PhysicsSystem extends System {
    public readonly engine: Engine;

    public constructor() {
        super();

        this.engine = Engine.create({
            gravity: { x: 0, y: 0 },
            // TODO: не работает засыпание, предметы просто зависают
            enableSleeping: false,
        });
    }

    @System.on([RigibBody])
    private onRigibBody(world: World, entity: number): void {
        const rb = world.getComponent(RigibBody, entity);

        Composite.add(this.engine.world, rb.body);
    }

    public override onSync(world: World, deltaS: number): void {
        const deltaMs = deltaS * 1000;

        Engine.update(this.engine, deltaMs);

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
}
