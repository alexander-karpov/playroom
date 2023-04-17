import { animate } from 'popmotion';
import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { Active, GameObject, RigibBody, Sound, Touched } from '~/components';
import * as THREE from 'three';
import { StarGeometry } from '~/geometries/StarGeometry';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body, Composite, Vector, type Engine, Common } from 'matter-js';
import { isMesh } from '~/utils/typeGuards';
import { Shine } from './Shine';
import { isMeshBasicMaterial } from '~/utils/isMeshBasicMaterial';
import { CollisionCategories } from './CollisionCategories';
import { Bits } from '~/utils/Bits';
import type GUI from 'lil-gui';
import { hslToRgb } from '~/utils/hslToRgb';
import { nameof } from '~/utils/nameof';

export class StarsSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starColor = hslToRgb(0.13, 1, 0.5);
    private readonly activeStarColor = new THREE.Color(0xff0000);

    public constructor(
        private readonly scene: THREE.Scene,
        private readonly engine: Engine,
        private readonly lil: GUI
    ) {
        super();
    }

    @System.on([Star])
    private onStar(world: World, entity: number): void {
        const star = world.getComponent(Star, entity);

        const size = 0.5 * fib(star.size + 10);
        const position = new THREE.Vector2(
            THREE.MathUtils.randFloatSpread(10),
            THREE.MathUtils.randFloatSpread(10)
        );

        /**
         * GameObject
         */
        const go = world.addComponent(GameObject, entity);

        go.object3d = new THREE.Mesh(
            this.starGeom,
            new THREE.MeshBasicMaterial({ color: this.starColor })
        );

        go.object3d.position.set(position.x, position.y, 0);
        go.object3d.matrixAutoUpdate = false;
        go.object3d.scale.multiplyScalar(size);
        writeEntityId(go.object3d.userData, entity);

        this.scene.add(go.object3d);

        /**
         * Body
         */
        const rb = world.addComponent(RigibBody, entity);
        rb.body = Bodies.circle(position.x, position.y, 1, {
            collisionFilter: {
                category: Bits.bit(CollisionCategories.Star),
                mask: Bits.bit3(
                    CollisionCategories.Star,
                    CollisionCategories.Wall,
                    CollisionCategories.Junk
                ),
            },
        });
        writeEntityId(rb.body.plugin, entity);
        Body.scale(rb.body, size, size);
        Body.setMass(rb.body, rb.body.mass * 10);

        Composite.add(this.engine.world, rb.body);
    }

    @System.on([Star, Touched])
    private onStarTouched(world: World, entity: number): void {
        if (!world.hasComponent(Shine, entity)) {
            world.addComponent(Shine, entity);
            world.deleteComponent(Shine, entity);
        }
    }

    @System.on([Star, Shine])
    private onStarHint(world: World, entity: number) {
        this.playSound(world, entity);
        this.playShineEffect(world, entity);
    }

    public override onCreate(world: World): void {
        this.setupLil(world);

        window.addEventListener('resize', function (ev) {
            const center = Vector.create(0, 0);
            for (const id of world.select([Star, RigibBody])) {
                const rb = world.getComponent(RigibBody, id);
                Body.setPosition(rb.body, center);
            }
        });
    }

    private playSound(world: World, entity: number) {
        const star = world.getComponent(Star, entity);

        // TODO: Нужна фунция для каждого компонента
        // которая делает это заполнение полей, хорошо если она
        // будет называться так же как класс
        const sound = world.addComponent(Sound, entity);
        sound.name = star.soundtrack;
        sound.throttleMs = 0;
    }

    private playShineEffect(world: World, entity: number) {
        const { object3d } = world.getComponent(GameObject, entity);
        const star = world.getComponent(Star, entity);

        if (
            isMesh(object3d) &&
            !Array.isArray(object3d.material) &&
            isMeshBasicMaterial(object3d.material)
        ) {
            const starColor = new THREE.Color(this.starColor);
            const color = object3d.material.color;

            animate({
                to: [1, 0],
                duration: fib(14),
                onUpdate: (t) => color.lerpColors(starColor, this.activeStarColor, t),
            });
        }
    }

    private setupLil(world: World) {
        /**
         * Stars
         */

        const starsConfig = {
            color: this.starColor,
        };

        this.lil
            .addColor(starsConfig, nameof<typeof starsConfig>('color'))
            .name('Цвет звёзд')
            .onChange((colorHex: number) => {
                for (const id of world.select([Star, GameObject])) {
                    const { object3d } = world.getComponent(GameObject, id);

                    if (
                        isMesh(object3d) &&
                        !Array.isArray(object3d.material) &&
                        isMeshBasicMaterial(object3d.material)
                    ) {
                        object3d.material.color.setHex(colorHex);
                    }
                }
            });
    }
}
