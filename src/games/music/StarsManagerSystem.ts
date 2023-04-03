import { animate } from 'popmotion';
import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { Active, GameObject, RigibBody, Sound, Touched } from '~/components';
import * as THREE from 'three';
import { StarGeometry } from '~/geometries/StarGeometry';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body } from 'matter-js';
import { isMesh } from '~/utils/isMesh';
import { Hint } from './Hint';
import { isMeshBasicMaterial } from '~/utils/isMeshBasicMaterial';

export class StarsManagerSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starColor = new THREE.Color(0x00ff00);
    private readonly activeStarColor = new THREE.Color(0xff0000);

    @System.on([Star])
    private onStar(world: World, entity: number): void {
        const star = world.getComponent(Star, entity);

        const angle = Math.random() * Math.PI * 2;
        const size = fib(star.size + 6);
        const position = new THREE.Vector2(0, 0);

        /**
         * GameObject
         */
        const go = world.addComponent(GameObject, entity);

        go.object = new THREE.Mesh(
            this.starGeom,
            new THREE.MeshBasicMaterial({ color: this.starColor.clone() })
        );

        go.object.position.set(position.x, position.y, 0);
        go.object.matrixAutoUpdate = false;
        go.object.rotation.z = angle;
        go.object.scale.multiplyScalar(size);
        writeEntityId(go.object.userData, entity);

        /**
         * Body
         */
        const body = world.addComponent(RigibBody, entity);
        body.body = Bodies.fromVertices(position.x, position.y, [this.starGeom.shape.getPoints()], {
            angle: angle,
        });
        writeEntityId(body.body.plugin, entity);
        Body.scale(body.body, size, size);
    }

    @System.on([Star, Touched])
    private onStarTouched(world: World, entity: number): void {
        const { soundtrack, numberInOrder } = world.getComponent(Star, entity);

        const sound = world.addComponent(Sound, entity);
        sound.name = soundtrack;
        sound.throttleMs = 0;

        if (!world.hasComponent(Active, entity)) {
            world.addComponent(Active, entity);
        }
    }

    @System.on([Star, Active])
    private onStarActive(world: World, entity: number): void {
        const { object } = world.getComponent(GameObject, entity);

        if (
            isMesh(object) &&
            !Array.isArray(object.material) &&
            isMeshBasicMaterial(object.material)
        ) {
            object.material.color.set(this.activeStarColor);
        }
    }

    @System.onNot([Star, Active])
    private onNotStarActive(world: World, entity: number): void {
        const { object } = world.getComponent(GameObject, entity);

        if (
            isMesh(object) &&
            !Array.isArray(object.material) &&
            isMeshBasicMaterial(object.material)
        ) {
            object.material.color.set(this.starColor);
        }
    }

    @System.on([Star, Hint])
    private onStarHint(world: World, entity: number) {
        const { object } = world.getComponent(GameObject, entity);

        const star = world.getComponent(Star, entity);

        const sound = world.addComponent(Sound, entity);
        sound.name = star.soundtrack;
        sound.throttleMs = 0;

        if (
            isMesh(object) &&
            !Array.isArray(object.material) &&
            isMeshBasicMaterial(object.material)
        ) {
            const color: THREE.Color = object.material.color;

            animate({
                to: [1, 0],
                duration: 500,
                onUpdate: (t) => color.lerpColors(this.starColor, this.activeStarColor, t),
            });
        }

        world.deleteComponent(Hint, entity);
    }
}
