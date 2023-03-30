import { Mesh, MeshBasicMaterial, PerspectiveCamera, Scene as ThreeScene } from 'three';
import { System, type World } from '@ecs';
import { fib } from '@utils/fib';
import { hslToRgb } from '@utils/hslToRgb';
import {
    Bodies,
    Vector,
    Common,
    Body,
    MouseConstraint,
    Composite,
    Bounds,
    Events,
} from 'matter-js';
import { Graphics, PI_2 } from 'pixi.js';
import { starShape } from '../../../geometries/shapes';
import * as bodyExtraProps from '../matterBodyExtraProps';
import { xylophone } from '@systems/AudioSystem';
import { PhysicalBody, Scene, Sound, VisualForm } from '@components';
import { Star } from '../components/Star';
import { choose } from '@utils/choose';
import { StarGeometry } from '../../../geometries/StarGeometry';

export class GameSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starMat = new MeshBasicMaterial({ color: 0x00ff00 });

    public override onCreate(world: World): void {
        const [, scene] = world.addEntity(Scene);

        scene.scene = new ThreeScene();
        scene.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        scene.camera.position.z = 5;

        this.createAtLeastStars(world, scene, 5);
    }

    public override onLink(world: World): void {
        // const { physics, mouse, renderer } = world.firstComponent(Application);
        // /**
        //  * Mouse constraint
        //  */
        // const mouseConstraint = MouseConstraint.create(physics, {
        //     mouse: mouse,
        //     constraint: {
        //         stiffness: 0.2,
        //     },
        // });
        // Composite.add(physics.world, mouseConstraint);
        // Events.on(mouseConstraint, 'mousedown', (e) => {
        //     const body = e.source.body as Body | null;
        //     const entityId = body && bodyExtraProps.entityId(body);
        //     if (entityId != null) {
        //         this.onBodyClick(world, entityId);
        //     }
        // });
        // /**
        //  * Walls
        //  */
        // const halfScreenWidth = renderer.width / 2;
        // const halfScreenHeight = renderer.height / 2;
        // const wallThickness = Math.max(renderer.width, renderer.height);
        // Composite.add(physics.world, [
        //     // walls
        //     Bodies.rectangle(
        //         -halfScreenWidth - wallThickness / 2,
        //         0,
        //         wallThickness,
        //         renderer.height + wallThickness * 2,
        //         { isStatic: true }
        //     ),
        //     Bodies.rectangle(
        //         halfScreenWidth + wallThickness / 2,
        //         0,
        //         wallThickness,
        //         renderer.height + wallThickness * 2,
        //         { isStatic: true }
        //     ),
        //     Bodies.rectangle(
        //         0,
        //         -halfScreenHeight - wallThickness / 2,
        //         renderer.width + wallThickness * 2,
        //         wallThickness,
        //         { isStatic: true }
        //     ),
        //     Bodies.rectangle(
        //         0,
        //         halfScreenHeight + wallThickness / 2,
        //         renderer.width + wallThickness * 2,
        //         wallThickness,
        //         { isStatic: true }
        //     ),
        // ]);
        // renderer.view.addEventListener?.('click', function (e) {
        //     const pointerEvent = e as PointerEvent;
        //     const stars = world.select([Star, Actor]);
        //     const cursorPosition = Vector.create(
        //         pointerEvent.offsetX - stage.position.x,
        //         pointerEvent.offsetY - stage.position.y
        //     );
        //     console.log(cursorPosition);
        //     for (const starId of stars) {
        //         const actor = world.getComponent(Actor, starId);
        //         if (Bounds.contains(actor.body.bounds, cursorPosition)) {
        //             console.log(actor.body.bounds);
        //         }
        //     }
        // });
    }

    private onBodyClick(world: World, entityId: number): void {
        if (world.hasComponent(Star, entityId)) {
            const star = world.getComponent(Star, entityId);

            const [, sound] = world.addEntity(Sound);
            sound.name = star.soundName;
            sound.throttleMs = 0;
            console.log(sound);
        }
    }

    private createStar(
        world: World,
        scene: Scene,
        position: Vector,
        size: number,
        angleRad: number
    ): void {
        const r = fib(size + 7);
        const [entityId, form] = world.addEntity(VisualForm);
        const star = world.addComponent(Star, entityId);
        const body = world.addComponent(PhysicalBody, entityId);

        form.object3d = new Mesh(this.starGeom, this.starMat);
        form.object3d.position.set(position.x, position.y, 0);

        body.body = Bodies.fromVertices(position.x, position.y, [this.starGeom.shape.getPoints()]);
        bodyExtraProps.setEntityId(body.body, entityId);

        star.soundName = xylophone[xylophone.length - size - 2]!;

        scene.scene.add(form.object3d);

        // Body.setAngle(actor.body, angleRad);
        // actor.graphics.rotation = angleRad;
    }

    private createAtLeastStars(world: World, scene: Scene, num: number): void {
        const stars = world.select([Star]);
        const numMissing = num - stars.length;

        for (let i = 0; i < numMissing; i++) {
            this.createStar(
                world,
                scene,
                Vector.create(0, 0),
                choose([1, 2, 3, 4]),
                Common.random(0, PI_2)
            );
        }
    }
}

console.warn(`
Переиспользовать Графику кубика для всех (одинаковых) кубиков
с целью оптимизации
`);
