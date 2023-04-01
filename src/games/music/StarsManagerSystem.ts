import { System } from '@ecs/System';
import type { World } from '@ecs/World';
import { Star } from './Star';
import { Active, GameObject, RigibBody, Sound, Touched } from '~/components';
import * as THREE from 'three';
import { StarGeometry } from '~/geometries/StarGeometry';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body } from 'matter-js';
import { isMesh } from '~/utils/isMesh';

export class StarsManagerSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly starMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    private readonly activeStarMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    @System.on([Star])
    private onStar(world: World, entity: number): void {
        const star = world.getComponent(Star, entity);

        const angle = Math.random() * Math.PI * 2;
        const size = fib(star.size + 9);
        const position = new THREE.Vector2(0, 0);

        /**
         * GameObject
         */
        const go = world.addComponent(GameObject, entity);

        go.object = new THREE.Mesh(this.starGeom, this.starMat);
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
            console.log(numberInOrder);
        }
    }

    @System.on([Star, Active])
    private onStarActive(world: World, entity: number): void {
        const { object } = world.getComponent(GameObject, entity);

        if (!isMesh(object)) {
            return;
        }

        object.material = this.activeStarMat;
    }

    @System.onNot([Star, Active])
    private onNotStarActive(world: World, entity: number): void {
        const { object } = world.getComponent(GameObject, entity);

        if (!isMesh(object)) {
            return;
        }

        object.material = this.starMat;
    }
}
