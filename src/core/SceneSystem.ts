import { System, type World } from '../ecs';
import { Application, Sprite } from '../components';


export class SceneSystem extends System {
    public override onCreate(world: World): void {

    }

    public override onLink(world: World): void {
        const app = world.select([Application])[0]!;
        const appComp = world.getComponent(Application, app);

        for (const sprite of world.select([Sprite])) {
            appComp.app!.stage.addChild(
                world.getComponent(Sprite, sprite).sprite!
            );
        }

    }
}
