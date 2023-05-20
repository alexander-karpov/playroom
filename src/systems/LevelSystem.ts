import { type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { PhysicsMotionType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeBox, PhysicsShapeCylinder } from '@babylonjs/core/Physics/v2/physicsShape';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Bits } from '~/utils/Bits';
import type { GUI } from 'lil-gui';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DebugableSystem } from './DebugableSystem';
import { fib } from '~/utils/fib';
import { GridMaterial } from '@babylonjs/materials/Grid';
import { type Material } from '@babylonjs/core/Materials/material';
import { type HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';
import { FilterCategory, getCollideMaskFor, getCategoryMask } from '~/FilterCategory';

export class LevelSystem extends DebugableSystem {
    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly havok: Promise<HavokPlugin>
    ) {
        super();

        this.createWalls();
        this.createRoundDiningTable(new Vector3(0, 0.74 / 2, 2));
        this.createCup(new Vector3(0, 0.74, 2 + 0.3));
        this.createCup(new Vector3(0, 0.74, 2 - 0.3));
        this.createCup(new Vector3(+0.3, 0.74, 2));
        this.createCup(new Vector3(-0.3, 0.74, 2));
    }

    private createBox(
        start: Vector3,
        end: Vector3,
        material: Material,
        membership: FilterCategory,
        isDynamic: boolean = false
    ) {
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

        /**
         * PhysicsBody
         */
        void this.havok.then(() => {
            const body = new PhysicsBody(
                node,
                isDynamic ? PhysicsMotionType.DYNAMIC : PhysicsMotionType.STATIC,
                true,
                this.scene
            );

            body.transformNode = node;

            body.shape = new PhysicsShapeBox(
                new Vector3(0, 0, 0),
                new Quaternion(0, 0, 0, 1),
                new Vector3(width, height, depth),
                this.scene
            );

            body.shape.filterMembershipMask = getCategoryMask(membership);
            body.shape.filterCollideMask = getCollideMaskFor(membership);
        });
    }

    private createCylinder(
        height: number,
        diameter: number,
        position: Vector3,
        material: Material,
        membership: FilterCategory,
        isDynamic: boolean = false
    ) {
        /**
         * Mesh
         */
        // TODO: Должны быть инстансы
        const node = CreateCylinder('staticCylinder', { height, diameter }, this.scene);
        node.position.copyFrom(position);

        node.material = material;

        /**
         * PhysicsBody
         */
        void this.havok.then(() => {
            const body = new PhysicsBody(
                node,
                isDynamic ? PhysicsMotionType.DYNAMIC : PhysicsMotionType.STATIC,
                true,
                this.scene
            );

            body.transformNode = node;

            body.shape = new PhysicsShapeCylinder(
                new Vector3(0, -height / 2, 0),
                new Vector3(0, height / 2, 0),
                diameter / 2,
                this.scene
            );

            body.shape.filterMembershipMask = getCategoryMask(membership);
            body.shape.filterCollideMask = getCollideMaskFor(membership);
        });
    }

    private createWalls() {
        const size = 8;
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
        this.createBox(
            new Vector3(x1, -1, y1),
            new Vector3(x2, 0, y2),
            material,
            FilterCategory.Static
        );
        // walls
        this.createBox(
            new Vector3(x1, 0, y1 - 1),
            new Vector3(x2, height, y1),
            material,
            FilterCategory.Static
        );
        this.createBox(
            new Vector3(x1, 0, y2),
            new Vector3(x2, height, y2 + 1),
            material,
            FilterCategory.Static
        );
        this.createBox(
            new Vector3(x1 - 1, 0, y1),
            new Vector3(x1, height, y2),
            material,
            FilterCategory.Static
        );
        this.createBox(
            new Vector3(x2, 0, y1),
            new Vector3(x2 + 1, height, y2),
            material,
            FilterCategory.Static
        );
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

        this.createCylinder(height, diameter, position, material, FilterCategory.Static);
    }

    /**
     * https://www.ikea.com/gb/en/p/vaerdera-teacup-with-saucer-white-40277459/
     */
    private createCup(position: Vector3) {
        const cupHeight = 0.08;
        const saucerHeight = 0.11 - cupHeight;
        const saucerDiameter = 0.18;
        const cupDiameter = saucerDiameter - 0.06;

        const saucerPosition = position.clone();
        saucerPosition.y += saucerHeight / 2;

        const cupPositon = saucerPosition.clone();
        cupPositon.y = position.y + saucerHeight + cupHeight / 2;

        const material = new GridMaterial('roundDiningTableMaterial', this.scene);
        material.mainColor = Color3.FromHSV(200, 0.5, 0.6);
        material.lineColor = Color3.FromHSV(200, 0.5, 0.4);
        material.majorUnitFrequency = 5;
        material.gridRatio = 0.01;

        this.createCylinder(
            saucerHeight,
            saucerDiameter,
            saucerPosition,
            material,
            FilterCategory.Thing,
            true
        );

        this.createCylinder(
            cupHeight,
            cupDiameter,
            cupPositon,
            material,
            FilterCategory.Thing,
            true
        );
    }
}
