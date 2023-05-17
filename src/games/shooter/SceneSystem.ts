import { type World } from '~/ecs';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import {
    PhysicsMotionType,
    PhysicsShapeType,
} from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeBox } from '@babylonjs/core/Physics/v2/physicsShape';
import { PhysicsAggregate } from '@babylonjs/core/Physics/v2/physicsAggregate';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Bits } from '~/utils/Bits';
import { FilterCategory } from './FilterCategory';
import { ShooterSystem } from './ShooterSystem';
import type { GUI } from 'lil-gui';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export class SceneSystem extends ShooterSystem {
    private readonly wallMat: StandardMaterial;

    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        /**
         * Wall material
         */
        this.wallMat = new StandardMaterial('wall', this.scene);
        this.wallMat.diffuseColor = Color3.White();

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Create a grid material
        const material = new StandardMaterial('grid', scene);

        // Our built-in 'sphere' shape.
        const box = CreateBox('box1', { size: 1 }, scene);

        for (let j = 0.51; j < 10; j += 1.05) {
            box.thinInstanceAdd(Matrix.Translation(0, j, 8), false);
        }

        box.thinInstanceAdd(Matrix.Translation(0, 11, 8), true);

        // Affect a material
        box.material = material;

        // Our built-in 'ground' shape.
        // const ground = CreateGround('ground1', { width: 32, height: 32, subdivisions: 2 }, scene);

        // // Affect a material
        // ground.material = material;

        const sphereAggregate = new PhysicsAggregate(
            box,
            PhysicsShapeType.BOX,
            { mass: 1, restitution: 0.75, startAsleep: true },
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

        this.createWall(new Vector3(-16, -16, -16), new Vector3(16, 16, -15));
        this.createWall(new Vector3(-16, -1, -16), new Vector3(16, 0, 16));
    }

    public override onDebug(gui: GUI): void {
        /**
         * Player marker
         */
        const mat = new StandardMaterial('markerMaterial', this.scene);
        mat.diffuseColor = Color3.Red();

        const playerCameraMarker = CreateBox('playerCameraMarker', { size: 0.2 }, this.scene);
        playerCameraMarker.material = mat;
        playerCameraMarker.parent = this.scene.activeCamera;
    }

    private createWall(start: Vector3, end: Vector3) {
        if (process.env['NODE_ENV'] !== 'production') {
            if (start.x >= end.x || start.y >= end.y || start.z >= end.z) {
                throw new Error(
                    'Все компоненты точки start должны быть меньше соотв. компонентов точки end'
                );
            }
        }

        const width = end.x - start.x;
        const height = end.y - start.y;
        const depth = end.z - start.z;

        /**
         * Mesh
         */
        // TODO: Должны быть инстансы
        const node = CreateBox('wall', { width, height, depth }, this.scene);

        node.material = this.wallMat;
        node.position.set(start.x + width / 2, start.y + height / 2, start.z + depth / 2);

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
