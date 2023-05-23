import { System, type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { DebugableSystem } from './DebugableSystem';
import { Tap } from '~/components/Tap';
import { RigidBody } from '~/components/RigidBody';
import { type PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { Pistol } from '~/components/Pistol';
import { raycast2 } from '~/utils/raycast2';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { PhysicsRaycastResult } from '@babylonjs/core/Physics/physicsRaycastResult';
import { FilterCategory, getCategoryMask, getCollideMaskFor } from '~/FilterCategory';

const shoot_dir = new Vector3();
const shoot_end = new Vector3();
const shoot_force = new Vector3();
const shoot_raycast = new PhysicsRaycastResult();

export class PistolSystem extends DebugableSystem {
    private readonly shotRange = 50;
    private readonly shotForce = 10;

    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly havok: HavokPlugin
    ) {
        super();
    }

    @System.on([Pistol, RigidBody, Tap])
    public onPistolTap(world: World, id: number) {
        const { body, bodyIndex } = this.world.get(id, RigidBody);
        console.log('shoot');
        this.shoot(body, bodyIndex);
    }

    private shoot(pistol: PhysicsBody, pistolIndex?: number) {
        const dir = shoot_dir;
        const end = shoot_end;
        const force = shoot_force;
        const result = shoot_raycast;

        pistol.transformNode.getDirectionToRef(Vector3.RightHandedBackwardReadOnly, dir);
        end.copyFrom(dir).scaleInPlace(this.shotRange);

        raycast2(
            this.havok,
            pistol.transformNode.position,
            end,
            result,
            getCategoryMask(FilterCategory.Thing),
            getCollideMaskFor(FilterCategory.Thing)
        );

        if (result.hasHit) {
            force.copyFrom(dir).scaleInPlace(this.shotForce);
            result.body?.applyImpulse(force, result.hitPointWorld, result.bodyIndex);
        }
    }
}
