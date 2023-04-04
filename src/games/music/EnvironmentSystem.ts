import { Bodies } from 'matter-js';
import * as THREE from 'three';
import { RigibBody } from '~/components';
import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';

//     https://stackoverflow.com/questions/34660063/threejs-converting-from-screen-2d-coordinate-to-world-3d-coordinate-on-the-came

export class EnvironmentSystem extends System {
    public constructor(private readonly projectionHelper: ProjectionHelper) {
        super();
    }

    public override onCreate(world: World): void {
        this.createWalls(world);
    }

    private createWalls(world: World): void {
        const bottomLeft = new THREE.Vector3();
        const topRight = new THREE.Vector3();
        const wallWidth = 300;
        const wallLength = 3000;

        this.projectionHelper.viewToWorld(-1, -1, bottomLeft);
        this.projectionHelper.viewToWorld(1, 1, topRight);

        const [, top] = world.addEntity(RigibBody);
        top.body = Bodies.rectangle(0, topRight.y + wallWidth / 2, wallLength, wallWidth, {
            isStatic: true,
        });

        const [, right] = world.addEntity(RigibBody);
        right.body = Bodies.rectangle(topRight.x + wallWidth / 2, 0, wallWidth, wallLength, {
            isStatic: true,
        });

        const [, bottom] = world.addEntity(RigibBody);
        bottom.body = Bodies.rectangle(0, bottomLeft.y - wallWidth / 2, wallLength, wallWidth, {
            isStatic: true,
        });

        const [, left] = world.addEntity(RigibBody);
        left.body = Bodies.rectangle(bottomLeft.x - wallWidth / 2, 0, wallWidth, wallLength, {
            isStatic: true,
        });
    }
}
