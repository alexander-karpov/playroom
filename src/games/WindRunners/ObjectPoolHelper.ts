import { type World } from '~/ecs';
import { Active, GameObject, RigibBody } from '~/components';
import { Body, Composite, type Engine } from 'matter-js';

export class ObjectPoolHelper {
    public static activate(world: World, engine: Engine, id: number) {
        if (!world.hasComponent(Active, id)) {
            world.addComponent(Active, id);
        }

        const { object3d } = world.getComponent(GameObject, id);
        const { body } = world.getComponent(RigibBody, id);

        object3d.visible = true;
        Body.setStatic(body, false);
        Composite.add(engine.world, body);
    }

    public static deactivate(world: World, engine: Engine, id: number) {
        if (world.hasComponent(Active, id)) {
            world.deleteComponent(Active, id);
        }

        const { object3d } = world.getComponent(GameObject, id);
        const { body } = world.getComponent(RigibBody, id);

        Composite.remove(engine.world, body);
        Body.setStatic(body, true);
        object3d.visible = false;
    }
}
