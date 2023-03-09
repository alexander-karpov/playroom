import { Application as PixiApplication } from 'pixi.js';
import { Engine } from 'matter-js';
import { System, type World } from '../ecs';
import { Application } from '../components';

export class ApplicationSystem extends System {
    public override onCreate(world: World): void {
        const [, component] = world.addEntity(Application);

        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';

        const pixi = new PixiApplication({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: Math.random() * 0xffffff,
            hello: true,
        });

        // @ts-expect-error
        document.body.appendChild(pixi.view);

        component.pixi = pixi;
        component.physics = Engine.create({
            gravity: { x: 0, y: 0.0 }
        });
    }
}
