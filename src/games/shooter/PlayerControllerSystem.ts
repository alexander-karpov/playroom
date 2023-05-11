import { System, type World } from '~/ecs';
import { type FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { Character } from './Character';
import { RigidBody } from './RigidBody';
import { Player } from './Player';

export class PlayerControllerSystem extends System {
    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly playerCamera: FreeCamera
    ) {
        super();
    }

    @System.on([Player, RigidBody])
    private onPlayerRigidbody(world: World, id: number) {
        for (const id of this.world.select([Player, Character, RigidBody])) {
            const { capsuleHeight } = this.world.get(id, Character);
            const { body } = this.world.get(id, RigidBody);

            this.playerCamera.parent = body.transformNode;
            this.playerCamera.position.set(0, capsuleHeight, 0);
        }
    }

    public override onUpdate(world: World, deltaSec: number): void {
        for (const id of this.world.select([Character, Player, RigidBody])) {
            const { direction } = this.world.get(id, Character);
            this.playerCamera.getDirectionToRef(Vector3.Forward(), direction);

            direction.y = 0;
            direction.normalize();
        }
    }
}