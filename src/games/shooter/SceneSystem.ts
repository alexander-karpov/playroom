import { System, type World } from '~/ecs';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import {
    PhysicsMotionType,
    PhysicsShapeType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeCapsule } from '@babylonjs/core/Physics/v2/physicsShape';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { GridMaterial } from '@babylonjs/materials/grid/gridMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Character } from './Character';
import { RigidBody } from './RigidBody';
import { Bits } from '~/utils/Bits';
import { Player } from './Player';

export class SceneSystem extends System {
    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Create a grid material
        const material = new GridMaterial('grid', scene);

        // Our built-in 'sphere' shape.
        const box = CreateBox('box1', { size: 1 }, scene);

        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();

        // Move the sphere upward 1/2 its height
        box.position.y = 2;

        // Affect a material
        box.material = material;

        // Our built-in 'ground' shape.
        const ground = CreateGround('ground1', { width: 32, height: 32, subdivisions: 2 }, scene);

        // Affect a material
        ground.material = material;

        const sphereAggregate = new PhysicsAggregate(
            box,
            PhysicsShapeType.BOX,
            { mass: 1, restitution: 0.75 },
            scene
        );

        setInterval(() => {
            box.thinInstanceRefreshBoundingInfo();
        }, 3000);

        sphereAggregate.body.shape!.filterMembershipMask = Bits.bit(3);
        sphereAggregate.body.shape!.filterCollideMask = Bits.bit3(1, 2, 3);

        // Create a static box shape.
        const groundAggregate = new PhysicsAggregate(
            ground,
            PhysicsShapeType.BOX,
            { mass: 0 },
            scene
        );

        groundAggregate.body.shape!.filterMembershipMask = Bits.bit(1);
        groundAggregate.body.shape!.filterCollideMask = Bits.bit2(2, 3);

        this.createPlayer();
    }

    private createPlayer() {
        const height = 2;
        const radius = 0.5;

        const node = CreateCapsule(
            'player',
            {
                height: height,
                radius: radius,
            },
            this.scene
        );

        node.position.set(-0.2, 10, -0.2);
        node.material = new GridMaterial('grid2', this.scene);

        const body = new PhysicsBody(node, PhysicsMotionType.ANIMATED, false, this.scene);

        // https://doc.babylonjs.com/features/featuresDeepDive/physics/shapes
        body.shape = new PhysicsShapeCapsule(
            new Vector3(0, -(height / 2 - radius), 0),
            new Vector3(0, height / 2 - radius, 0),
            radius,
            this.scene
        );

        body.shape.filterMembershipMask = Bits.bit(2);
        body.shape.filterCollideMask = Bits.bit2(1, 3);

        /**
         * Character
         */
        const [id, character] = this.world.newEntity(Character);
        character.capsuleHeight = height;

        /**
         * Player
         */
        const player = this.world.attach(id, Player);
        player.speed = 5;

        /**
         * RigidBody
         */
        const rb = this.world.attach(id, RigidBody);
        rb.body = body;
    }
}
