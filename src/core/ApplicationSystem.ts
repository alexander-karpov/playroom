import { Application as PixiApplication } from 'pixi.js';
import { System, type World } from '../ecs';
import { Application } from '../components';

export class ApplicationSystem extends System {
    public override onCreate(world: World): void {
        const [, component] = world.addEntity(Application);

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        const app = new PixiApplication({
            width: window.innerWidth,
            height: window.innerHeight,
            useContextAlpha: false,
            antialias: false,
            backgroundColor: 0x429387,
            hello: true,
        });

        // @ts-expect-error
        document.body.appendChild(app.view);

        component.app = app;
    }
}
