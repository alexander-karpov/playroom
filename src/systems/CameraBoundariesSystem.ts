import { type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { DebugableSystem } from './DebugableSystem';
import { type FirstPersonCamera } from '~/FirstPersonCamera';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { raycast2 } from '~/utils/raycast2';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { FilterCategory, getCategoryMask, getCollideMaskFor } from '~/FilterCategory';

const nextPosition = new Vector3();
const raycastEnd = new Vector3();
const raycastResult = new PhysicsRaycastResult();

export class CameraBoundariesSystem extends DebugableSystem {
    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly camera: FirstPersonCamera,
        private readonly havok: HavokPlugin
    ) {
        super();
    }

    public override onUpdate(world: World, deltaSec: number): void {
        const { cameraDirection, position } = this.camera;

        if (cameraDirection.x === 0 && cameraDirection.z === 0) {
            return;
        }

        nextPosition.copyFrom(position).addInPlace(cameraDirection);
        this.raycastBoundaryToRef(nextPosition, raycastResult);

        if (raycastResult.hasHit) {
            cameraDirection.setAll(0);
        }
    }

    private raycastBoundaryToRef(position: Vector3, result: PhysicsRaycastResult) {
        raycastEnd.copyFrom(position);
        raycastEnd.y = -3;

        raycast2(
            this.havok,
            position,
            raycastEnd,
            result,
            getCategoryMask(FilterCategory.Player),
            getCollideMaskFor(FilterCategory.Player)
        );
    }
}
