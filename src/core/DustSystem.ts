import { Common } from 'matter-js';
import { System, type World } from '../ecs';
import { Application, Camera, Dust } from '../components';
import { ParticleContainer, Sprite, Texture } from 'pixi.js';

export class DustSystem extends System {
    public override onCreate(world: World): void {
        const [, dust] = world.addEntity(Dust);

        const particlesNumber = Math.round(window.innerWidth * window.innerHeight / 200000);

        dust.container = new ParticleContainer(particlesNumber);

        for (let i = 0; i < particlesNumber; ++i) {
            const sprite = Sprite.from(Texture.WHITE);
            sprite.position.set(Common.random(0, window.innerWidth), Common.random(0, window.innerHeight));
            dust.container.addChild(sprite);
        }
    }

    public override onOutput(world: World, delta: number): void {
        const camera = world.firstComponent(Camera);
        const { renderer } = world.getComponent(Application, world.first([Application]));
        const dust = world.firstComponent(Dust);

        const absX = camera.position.x % window.innerWidth;
        const x = camera.position.x < 0 ? window.innerWidth + absX : absX;
        const x2 = x - window.innerWidth;

        const absY = camera.position.y % window.innerHeight;
        const y = camera.position.y < 0 ? window.innerHeight + absY : absY;
        const y2 = y - window.innerHeight;

        let clear: boolean = true;

        for (const [_x, _y] of [
            [x, y], [x2, y],
            [x, y2], [x2, y2],
        ]) {
            dust.container.pivot.set(
                _x,
                _y
            );
            renderer.render(dust.container, { clear });
            clear = false;
        }


    }
}
