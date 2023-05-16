import { type World } from '~/ecs';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import {
    PhysicsMotionType,
    PhysicsShapeType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeBox, PhysicsShapeCapsule } from '@babylonjs/core/Physics/v2/physicsShape';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { RigidBody } from './RigidBody';
import { Bits } from '~/utils/Bits';
import { FilterCategory } from './FilterCategory';
import { ShooterSystem } from './ShooterSystem';

export class SceneSystem extends ShooterSystem {
    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Create a grid material
        const material = new StandardMaterial('grid', scene);

        // Our built-in 'sphere' shape.
        const box = CreateBox('box1', { size: 1 }, scene);
        // box.position.y = 2;

        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();
        box.thinInstanceAddSelf();

        // Affect a material
        box.material = material;

        // Our built-in 'ground' shape.
        // const ground = CreateGround('ground1', { width: 32, height: 32, subdivisions: 2 }, scene);

        // // Affect a material
        // ground.material = material;

        const sphereAggregate = new PhysicsAggregate(
            box,
            PhysicsShapeType.BOX,
            { mass: 1, restitution: 0.75 },
            scene
        );

        sphereAggregate.body.disablePreStep = false;

        setInterval(() => {
            box.thinInstanceRefreshBoundingInfo();
        }, 3000);

        sphereAggregate.body.shape!.filterMembershipMask = Bits.bits(FilterCategory.Thing);
        sphereAggregate.body.shape!.filterCollideMask = Bits.bits(
            FilterCategory.Ground,
            FilterCategory.Character,
            FilterCategory.Thing
        );

        // // Create a static box shape.
        // const groundAggregate = new PhysicsAggregate(
        //     ground,
        //     PhysicsShapeType.BOX,
        //     { mass: 0 },
        //     scene
        // );

        // groundAggregate.body.shape!.filterMembershipMask = Bits.bit(1);
        // groundAggregate.body.shape!.filterCollideMask = Bits.bit2(2, 3);

        this.createGround();
    }

    private createGround() {
        const width = 32;
        const height = 1;
        const depth = 32;

        /**
         * Mesh
         */
        const node = CreateBox('ground', { width, height, depth }, this.scene);

        node.material = new StandardMaterial('ground', this.scene);
        node.position = new Vector3(0, -5, 0);

        /**
         * PhysicsBody
         */
        const body = new PhysicsBody(node, PhysicsMotionType.STATIC, false, this.scene);
        body.shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0),
            new Quaternion(0, 0, 0, 1),
            new Vector3(width, height, depth),
            this.scene
        );
        body.transformNode = node;

        body.shape.filterMembershipMask = Bits.bits(FilterCategory.Ground);
        body.shape.filterCollideMask = Bits.bits(FilterCategory.Character, FilterCategory.Thing);
    }
}
