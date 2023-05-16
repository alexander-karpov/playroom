import { type World } from '~/ecs';
import { ShooterSystem } from './ShooterSystem';
import { type Scene } from '@babylonjs/core/scene';
import { PointerEventTypes, type PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { TmpVectors, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { raycast2 } from './raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { Bits } from '~/utils/Bits';
import { FilterCategory } from './FilterCategory';

export class HandsSystem extends ShooterSystem {
    private readonly ray = new Ray(Vector3.Zero(), Vector3.Zero());
    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly pickupDistance = 100;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly havok: HavokPlugin
    ) {
        super();

        this.scene._inputManager._addCameraPointerObserver(
            this.onTap.bind(this),
            PointerEventTypes.POINTERTAP
        );
    }

    private onTap(p: PointerInfo) {
        this.scene.createPickingRayToRef(
            p.event.offsetX,
            p.event.offsetY,
            null,
            this.ray,
            this.scene.activeCamera
        );

        const end = TmpVectors.Vector3[0];
        end.copyFrom(this.ray.direction)
            .scaleInPlace(this.pickupDistance)
            .addInPlace(this.ray.origin);

        raycast2(
            this.havok,
            this.ray.origin,
            end,
            this.raycastResult,
            Bits.bit(FilterCategory.Character),
            Bits.bit(FilterCategory.Thing)
        );

        if (this.raycastResult.hasHit) {
            const impulse = TmpVectors.Vector3[0];
            impulse.copyFrom(this.ray.direction).scaleInPlace(20);

            this.raycastResult.body?.applyImpulse(
                impulse,
                this.raycastResult.hitPointWorld,
                this.raycastResult.bodyIndex
            );
        }
    }
}
