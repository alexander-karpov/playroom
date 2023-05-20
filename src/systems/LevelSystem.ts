import { type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { PhysicsMotionType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeBox } from '@babylonjs/core/Physics/v2/physicsShape';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Bits } from '~/utils/Bits';
import type { GUI } from 'lil-gui';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DebugableSystem } from './DebugableSystem';
import { fib } from '~/utils/fib';
import { GridMaterial } from '@babylonjs/materials/Grid';
import { type Material } from '@babylonjs/core/Materials/material';

export class LevelSystem extends DebugableSystem {
    public constructor(private readonly world: World, private readonly scene: Scene) {
        super();

        this.createWalls();
        this.createRoundDiningTable(new Vector3(0, 0.74 / 2, 3));
    }

    private createStaticBox(start: Vector3, end: Vector3, material: Material) {
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
        const node = CreateBox('staticBox', { width, height, depth }, this.scene);

        node.material = material;
        node.position.set(start.x + width / 2, start.y + height / 2, start.z + depth / 2);

        // /**
        //  * PhysicsBody
        //  */
        // const body = new PhysicsBody(node, PhysicsMotionType.STATIC, false, this.scene);
        // body.shape = new PhysicsShapeBox(
        //     new Vector3(0, 0, 0),
        //     new Quaternion(0, 0, 0, 1),
        //     new Vector3(width, height, depth),
        //     this.scene
        // );
        // body.transformNode = node;

        // body.shape.filterMembershipMask = Bits.bits(FilterCategory.Ground);
        // body.shape.filterCollideMask = Bits.bits(FilterCategory.Character, FilterCategory.Thing);
    }
    private createStaticCylinder(
        height: number,
        diameter: number,
        position: Vector3,
        material: Material
    ) {
        /**
         * Mesh
         */
        // TODO: Должны быть инстансы
        const node = CreateCylinder('staticCylinder', { height, diameter }, this.scene);
        node.position.copyFrom(position);

        node.material = material;

        // /**
        //  * PhysicsBody
        //  */
        // const body = new PhysicsBody(node, PhysicsMotionType.STATIC, false, this.scene);
        // body.shape = new PhysicsShapeBox(
        //     new Vector3(0, 0, 0),
        //     new Quaternion(0, 0, 0, 1),
        //     new Vector3(width, height, depth),
        //     this.scene
        // );
        // body.transformNode = node;

        // body.shape.filterMembershipMask = Bits.bits(FilterCategory.Ground);
        // body.shape.filterCollideMask = Bits.bits(FilterCategory.Character, FilterCategory.Thing);
    }

    private createWalls() {
        const size = 16;
        const height = 3;
        const halfSize = size / 2;

        const material = new GridMaterial('wallMaterial', this.scene);

        material.mainColor = Color3.FromHSV(0, 0, 0.8);
        material.lineColor = Color3.FromHSV(0, 0, 0.5);
        material.majorUnitFrequency = 5;

        const x1 = -halfSize;
        const x2 = halfSize;
        const y1 = -halfSize;
        const y2 = halfSize;

        // floor
        this.createStaticBox(new Vector3(x1, -1, y1), new Vector3(x2, 0, y2), material);
        // walls
        this.createStaticBox(new Vector3(x1, 0, y1 - 1), new Vector3(x2, height, y1), material);
        this.createStaticBox(new Vector3(x1, 0, y2), new Vector3(x2, height, y2 + 1), material);
        this.createStaticBox(new Vector3(x1 - 1, 0, y1), new Vector3(x1, height, y2), material);
        this.createStaticBox(new Vector3(x2, 0, y1), new Vector3(x2 + 1, height, y2), material);
    }

    /**
     * https://www.dimensions.com/element/round-dining-table
     * https://www.ikea.com/gb/en/p/lisabo-table-ash-veneer-40416498/
     */
    private createRoundDiningTable(position: Vector3) {
        /**
         * How tall is a dining room table?
         * Due to lack of a set industry standard, dining room table height
         * is often dependent on average chair heights. The general range
         * is between 28-30 inches (71-76cm) although 30 inches (76cm) is seen
         * as the most common height especially when looking at more formal
         * dining tables.
         */
        const height = 0.74;

        /**
         * How wide is a dining room table?
         * The width of a dining room table varies depending on shape with
         * standards typically determined based on the number of people at the table.
         * A square or four person table ranges between 34”-44” wide (86.4-112cm) while
         * a rectangle or six person table ranges between 36”-40” wide (91.4-101.6cm).
         * A round table shares a similar range as the square table, but in diameter.
         */
        const diameter = 1.05;

        const material = new GridMaterial('roundDiningTableMaterial', this.scene);
        material.mainColor = Color3.FromHSV(0, 0, 0.6);
        material.lineColor = Color3.FromHSV(0, 0, 0.4);
        material.majorUnitFrequency = 5;
        material.gridRatio = 0.1;

        this.createStaticCylinder(height, diameter, position, material);
    }
}
