import { Sprite as PixiSprite, AnimatedSprite, Spritesheet, BaseTexture, type ISpritesheetFrameData, SCALE_MODES } from 'pixi.js';
import { System, type World } from '../ecs';
import { Application, Sprite } from '../components';



function frame(n: number, line: number): ISpritesheetFrameData {
    return {
        frame: { x: 64 * n, y: 64 * line, w: 64, h: 64 }
    };
}

function frames(count: number, line: number, prefix: string): Record<string, ISpritesheetFrameData> {
    const fs: Record<string, ISpritesheetFrameData> = {};

    for (let i = 0; i < count; i++) {
        fs[`${prefix}${i}`] = frame(i, line);
    }

    return fs;
}

function animation(count: number, name: string): string[] {
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
        result.push(`${name}${i}`);
    }

    return result;
}

const y = 64;
const atlasData = {
    frames: {
        ...frames(8, 1, 'run'),
    },
    meta: { scale: '1' },
    animations: {
        run: animation(8, 'run') //array of frames by name
    }
};

const spritesheet = new Spritesheet(
    BaseTexture.from('https://storage.yandexcloud.net/kukuruku-games/jedi/Jedai-spritesheet.png', {
        scaleMode: SCALE_MODES.NEAREST
    }),
    atlasData
);
const parsed = spritesheet.parse();


export class SceneSystem extends System {
    public override onCreate(world: World): void {


        void parsed.then(() => {
            const [, component] = world.addEntity(Sprite);
            const anim = new AnimatedSprite(spritesheet.animations['run']!);

            component.sprite = anim;
            component.sprite.position.x = 100;
            component.sprite.position.y = 100;

            // Это можно убрать когда добавится оброаботка промисов в системах
            const app = world.select([Application])[0]!;
            const appComp = world.getComponent(Application, app);

            for (const sprite of world.select([Sprite])) {
                appComp.app!.stage.addChild(
                    world.getComponent(Sprite, sprite).sprite!
                );
            }
            anim.scale = { x: 4, y: 4 };
            anim.loop = true;
            anim.roundPixels = true;
            anim.animationSpeed = 0.2;
            anim.gotoAndPlay(0);
        });


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
