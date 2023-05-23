import { System, type World } from '~/ecs';
import { DebugableSystem } from './DebugableSystem';
import { type Scene } from '@babylonjs/core/scene';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
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
import { type Mesh } from '@babylonjs/core/Meshes/mesh';
import { Epsilon } from '@babylonjs/core/Maths/math.constants';
import { LongTap } from '~/components/LongTap';
import { Handheld } from '~/components/Handheld';
import { RigidBody } from '~/components/RigidBody';
import { PrivilegedTapListener } from '~/components/PrivilegedTapListener';
import { readEntityId } from '~/utils/entityHelpers';

const drop_end = new Vector3();
const putForward = new Vector3();
const quat = Quaternion.Zero();

export class HandSystem extends DebugableSystem {
    private readonly hand: PhysicsBody;
    private bodyInHand?: PhysicsBody;
    private bodyInHandIndex?: number;
    private readonly constraint: Physics6DoFConstraint;
    private readonly handLength = 0.6;

    // Это нужно чтобы поместить руку куда-то чтобы положить предмет
    private isHandAnimated = false;

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
        this.hand = new PhysicsBody(node, PhysicsMotionType.ANIMATED, true, this.scene);

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
    }

    private get isThingHeld(): boolean {
        return Boolean(this.constraint._pluginData);
    }

    @System.on([RigidBody, LongTap])
    public onRigidBodyTouched(world: World, id: number) {
        if (this.isHandAnimated) {
            return;
        }

        const isHandheld = this.world.has(id, Handheld);
        const { body, bodyIndex } = this.world.get(id, RigidBody);
        const { point, normal } = this.world.get(id, LongTap);

        /**
         * Клик в удерживаемый предмет
         */
        if (body === this.bodyInHand && bodyIndex === this.bodyInHandIndex) {
            this.drop(16);

            return;
        }

        /**
         * Клик с предметом в руке
         */
        if (this.bodyInHand) {
            this.put(point, normal);

            return;
        }

        /**
         * Клик в другой предмет
         */
        if (isHandheld) {
            this.pickup(body, bodyIndex);

            return;
        }
    }

    public override onUpdate(world: World, deltaSec: number): void {
        this.updateHandPosition();
    }

    public override onDebug(gui: GUI): void {
        /**
         * Hands marker
         */
        const mat = new StandardMaterial('handsMaterial', this.scene);
        mat.diffuseColor = new Color3(1, 0, 1);

        const handsMarker = CreateBox('handsMarker', { size: 0.01 }, this.scene);
        handsMarker.material = mat;
        handsMarker.parent = this.hand.transformNode;
    }

    private put(point: Vector3, normal: Vector3) {
        if (!this.bodyInHand?.shape) {
            return;
        }

        const bb = (this.bodyInHand.transformNode as Mesh).getBoundingInfo();
        const height = bb.maximum.y - bb.minimum.y;

        // Преподнимаем точку куда класть
        this.hand.transformNode.position
            .copyFrom(normal)
            .scaleInPlace(height / 2 + Epsilon)
            .addInPlace(point);

        if (this.hand.transformNode.rotationQuaternion) {
            normal.getNormalToRef(putForward);

            // Поворачиваем предмет примерно как он был в руке
            Quaternion.RotationAxisToRef(
                normal,
                // Эмпирически
                this.hand.transformNode.rotation.y + Math.PI * 1.5,
                quat
            );

            putForward.normalize().applyRotationQuaternionInPlace(quat);

            // Поворачиваем по нормали куда кладём
            Quaternion.FromLookDirectionRHToRef(
                putForward,
                normal,
                this.hand.transformNode.rotationQuaternion
            );
        }

        this.hand.disablePreStep = false;
        this.isHandAnimated = true;

        setTimeout(() => {
            this.drop(0);

            this.isHandAnimated = false;
            this.hand.disablePreStep = true;
        }, 200);
    }

    private updateHandPosition() {
        if (!this.isThingHeld) {
            this.hand.disablePreStep = true;

            return;
        }

        if (this.isHandAnimated) {
            return;
        }

        this.camera.getDirectionToRef(
            Vector3.LeftHandedForwardReadOnly,
            this.hand.transformNode.position
        );

        this.hand.transformNode.position
            .scaleInPlace(this.handLength)
            .addInPlace(this.camera.position);

        this.hand.transformNode.rotationQuaternion?.copyFrom(this.camera.absoluteRotation);

        this.hand.disablePreStep = false;
    }

    private pickup(thing: PhysicsBody, thingIndex?: number) {
        if (this.isThingHeld) {
            this.drop(0);
        }

        this.hand.addConstraint(thing, this.constraint, undefined, thingIndex);

        this.bodyInHand = thing;
        this.bodyInHandIndex = thingIndex;

        const entityId = readEntityId(thing.transformNode);

        if (entityId != null) {
            this.world.attach(entityId, PrivilegedTapListener);
        }

        this.updateHandPosition();
    }

    private drop(impulse: number) {
        const end = drop_end;

        if (!this.isThingHeld) {
            return;
        }

        this.constraint.dispose();

        if (impulse > 0) {
            this.camera.getDirectionToRef(Vector3.LeftHandedForwardReadOnly, end);
            end.scaleInPlace(impulse);

            this.bodyInHand?.applyImpulse(
                end,
                this.hand.transformNode.position,
                this.bodyInHandIndex
            );
        }

        const entityId = readEntityId(this.bodyInHand!.transformNode);

        if (entityId != null) {
            this.world.detach(entityId, PrivilegedTapListener);
        }

        this.bodyInHand = undefined;
        this.bodyInHandIndex = undefined;
    }
}
