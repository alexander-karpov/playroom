import { type World } from '~/ecs';
import { ShooterSystem } from './ShooterSystem';
import { type Scene } from '@babylonjs/core/scene';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { raycast2 } from './raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { Bits } from '~/utils/Bits';
import { FilterCategory } from './FilterCategory';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { PhysicsShapeSphere } from '@babylonjs/core/Physics/v2/physicsShape';
import {
    PhysicsConstraintAxis,
    PhysicsMotionType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import type { GUI } from 'lil-gui';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Physics6DoFConstraint } from '@babylonjs/core/Physics/v2/physicsConstraint';
import { type Camera } from '@babylonjs/core/Cameras/camera';
import { fib } from '~/utils/fib';

export class MazeSystem extends ShooterSystem {
    // prettier-ignore
    private readonly maze = [
        1, 1, 1, 0, 0,
        0, 0, 1, 0, 0,
        1, 1, 1, 1, 0,
        0, 0, 1, 0, 0,
        0, 0, 1, 1, 1,
    ];

    private readonly mazeWidth = 5;
    private readonly roomsIds = this.maze.map(() => -1);
    private readonly roomSize = fib(10);

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();
    }

    public override onUpdate(world: World, deltaSec: number): void {
        const ci = this.activeRoomIndex();

        if (ci !== i) {
            i = ci;
            console.log(i, this.scene.activeCamera?.position);
        }
    }

    private activeRoomIndex(): number {
        const pos = this.scene.activeCamera?.position;
        const halfSize = this.roomSize / 2;

        if (!pos) {
            return -1;
        }

        return (
            (Math.floor((pos.x + halfSize) / this.roomSize) % this.mazeWidth) +
            Math.floor((pos.z + halfSize) / this.roomSize) * this.mazeWidth
        );
    }
}

let i = -1;
