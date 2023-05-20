import { type World } from '~/ecs';
import { DebugableSystem } from '../../systems/DebugableSystem';
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
import { type TargetCamera } from '@babylonjs/core/Cameras/targetCamera';

const raycastEnd = new Vector3();
const ray = new Ray(Vector3.Zero(), Vector3.Zero());
const raycastResult = new PhysicsRaycastResult();

export class HandsSystem extends DebugableSystem {
    private readonly hand: PhysicsBody;
    private thingInHand?: PhysicsBody;
    private thingInHandIndex?: number;
    private readonly constraint: Physics6DoFConstraint;
    private readonly pickupDistance = 100;
    private readonly handLength = 4;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly camera: TargetCamera,
        private readonly havok: HavokPlugin
    ) {
        super();

        /**
         * Hand
         */
        const node = new TransformNode('hand', this.scene);
        node.position.set(0, 8, 0);

        this.hand = new PhysicsBody(node, PhysicsMotionType.ANIMATED, true, this.scene);
        this.hand.shape = new PhysicsShapeSphere(new Vector3(0, 0, 0), 0.1, this.scene);
        this.hand.shape.filterMembershipMask = Bits.bit(FilterCategory.Hands);
        this.hand.shape.filterCollideMask = 0;

        /**
         * Constraint
         */
        this.constraint = new Physics6DoFConstraint(
            {
                pivotA: new Vector3(0, 0, 0),
                pivotB: new Vector3(0, 0.0, 0),
                perpAxisA: new Vector3(1, 0, 0),
                perpAxisB: new Vector3(1, 0, 0),
            },
            [
                { axis: PhysicsConstraintAxis.LINEAR_X, minLimit: 0, maxLimit: 0 },
                { axis: PhysicsConstraintAxis.LINEAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: PhysicsConstraintAxis.LINEAR_Z, minLimit: 0, maxLimit: 0 },
                { axis: PhysicsConstraintAxis.ANGULAR_X, minLimit: 0, maxLimit: 0 },
                { axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit: 0, maxLimit: 0 },
                { axis: PhysicsConstraintAxis.ANGULAR_Z, minLimit: 0, maxLimit: 0 },
            ],
            this.scene
        );

        // TODO: Отписываться если камера перестала быть активной

        this.scene._inputManager._addCameraPointerObserver(
            this.onTap.bind(this),
            PointerEventTypes.POINTERTAP
        );
    }

    private get isThingHeld(): boolean {
        return Boolean(this.constraint._pluginData);
    }

    public override onUpdate(world: World, deltaSec: number): void {
        this.updateHandPosition();
    }

    public override onDebug(gui: GUI): void {
        /**
         * Hands marker
         */
        const mat = new StandardMaterial('handsMaterial', this.scene);
        mat.diffuseColor = Color3.Yellow();

        const handsMarker = CreateBox('handsMarker', { size: 0.1 }, this.scene);
        handsMarker.material = mat;
        handsMarker.parent = this.hand.transformNode;
    }

    private onTap(p: PointerInfo) {
        this.raycastThingToRef(p, raycastResult);

        /**
         * Клик в удерживаемый предмет
         */
        if (
            raycastResult.hasHit &&
            this.isThingHeld &&
            this.thingInHand === raycastResult.body &&
            this.thingInHandIndex === raycastResult.bodyIndex
        ) {
            this.dropThing(16);

            return;
        }

        /**
         * Клик в другой предмет
         */
        if (raycastResult.hasHit && raycastResult.body) {
            this.takeThing(raycastResult.body, raycastResult.bodyIndex);

            return;
        }

        /**
         * Клик в никуда
         */
        if (this.isThingHeld) {
            this.dropThing(0);
        }
    }

    private updateHandPosition() {
        // if (!this.isThingHeld) {
        //     this.hand.disablePreStep = true;

        //     return;
        // }

        this.camera.getDirectionToRef(
            Vector3.LeftHandedForwardReadOnly,
            this.hand.transformNode.position
        );

        this.hand.transformNode.position.scaleInPlace(this.handLength);
        this.hand.transformNode.position.addInPlace(this.camera.position);

        this.hand.transformNode.rotation.copyFrom(this.camera.rotation);
        this.hand.transformNode.rotationQuaternion?.copyFrom(this.camera.absoluteRotation);

        this.hand.disablePreStep = false;
    }

    private raycastThingToRef(p: PointerInfo, result: PhysicsRaycastResult) {
        this.scene.createPickingRayToRef(p.event.offsetX, p.event.offsetY, null, ray, this.camera);

        raycastEnd.copyFrom(ray.direction).scaleInPlace(this.pickupDistance).addInPlace(ray.origin);

        raycast2(
            this.havok,
            ray.origin,
            raycastEnd,
            result,
            Bits.bit(FilterCategory.Character),
            Bits.bit(FilterCategory.Thing)
        );
    }

    private takeThing(thing: PhysicsBody, thingIndex?: number) {
        if (this.isThingHeld) {
            this.dropThing(0);
        }

        this.hand.addConstraint(thing, this.constraint, undefined, thingIndex);
        this.thingInHand = thing;
        this.thingInHandIndex = thingIndex;
    }

    private dropThing(impulse: number) {
        if (!this.isThingHeld) {
            return;
        }

        this.constraint.dispose();

        if (impulse > 0) {
            this.camera.getDirectionToRef(Vector3.LeftHandedForwardReadOnly, raycastEnd);
            raycastEnd.scaleInPlace(impulse);

            this.thingInHand?.applyImpulse(
                raycastEnd,
                this.hand.transformNode.position,
                this.thingInHandIndex
            );
        }

        this.thingInHand = undefined;
        this.thingInHandIndex = undefined;
    }
}
