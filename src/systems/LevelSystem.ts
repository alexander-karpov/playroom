import { type World } from '~/ecs';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import type { Scene } from '@babylonjs/core/scene';
import { PhysicsBody } from '@babylonjs/core/Physics/v2/physicsBody';
import { PhysicsMotionType } from '@babylonjs/core/Physics/v2/IPhysicsEnginePlugin';
import { PhysicsShapeBox, PhysicsShapeCylinder } from '@babylonjs/core/Physics/v2/physicsShape';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { BackgroundMaterial } from '@babylonjs/core/Materials/Background/backgroundMaterial';
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
import { writeEntityId } from '~/utils/entityHelpers';
import { type Mesh } from '@babylonjs/core/Meshes/mesh';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { LightSwitch } from '~/components/LightSwitch';
import { GameObject } from '~/components/GameObject';
import { RigidBody } from '~/components/RigidBody';
import { Handheld } from '~/components/Handheld';
import { Pistol } from '~/components/Pistol';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

export class LevelSystem extends DebugableSystem {
    public constructor(
        private readonly world: World,
        private readonly scene: Scene,
        private readonly havok: Promise<HavokPlugin>
    ) {
        super();

        const backgroundMaterial = new StandardMaterial('groundMaterial', this.scene);
        const texture = new Texture(
            'https://storage.yandexcloud.net/kukuruku-games/assets/textures/ground_12-1K/1K-ground_12_basecolor-min.png',
            scene
        );

        backgroundMaterial.diffuseTexture = texture;

        texture.uScale = 16;
        texture.vScale = 16;
        const plane = CreatePlane('ground', { height: 64, width: 64 }, this.scene);
        plane.material = backgroundMaterial;
        plane.position.set(0, 0.01, 0);
        plane.rotate(Vector3.LeftReadOnly, -Math.PI / 2);

        // this.scene.ambientColor = new Color3(0.5, 0.5, 0.5);

        /**
         * Directional Light
         */
        const directionalLight = new DirectionalLight(
            'directional',
            new Vector3(-0.5, -0.65, -0.57),
            scene
        );

        directionalLight.radius = 0.04;
        directionalLight.intensity = 0.5;

        this.createWalls();
        this.createRoundDiningTable(new Vector3(0, 0.74 / 2, 2));
        this.createCup(new Vector3(0, 0.74, 2 + 0.3));
        this.createCup(new Vector3(0, 0.74, 2 - 0.3));
        this.createCup(new Vector3(+0.3, 0.74, 2));
        this.createCup(new Vector3(-0.3, 0.74, 2));
        // this.createLightSwitch(new Vector3(-2, 0.3, 2), [directionalLight.uniqueId]);

        this.createPistol(new Vector3(0, 0.74 + 0.1, 2));
    }

    private createBox(
        start: Vector3,
        end: Vector3,
        material: Material,
        membership: FilterCategory,
        isDynamic: boolean = false
    ): number {
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
        const mesh = CreateBox('box', { width, height, depth }, this.scene);

        mesh.material = material;
        mesh.position.set(start.x + width / 2, start.y + height / 2, start.z + depth / 2);

        /**
         * GameObject
         */
        const [entityId, go] = this.world.newEntity(GameObject);

        go.node = mesh;
        writeEntityId(mesh, entityId);

        /**
         * PhysicsBody
         */
        void this.havok.then(() => {
            const body = new PhysicsBody(
                mesh,
                isDynamic ? PhysicsMotionType.DYNAMIC : PhysicsMotionType.STATIC,
                true,
                this.scene
            );

            body.transformNode = mesh;

            body.shape = new PhysicsShapeBox(
                new Vector3(0, 0, 0),
                new Quaternion(0, 0, 0, 1),
                new Vector3(width, height, depth),
                this.scene
            );

            body.shape.filterMembershipMask = getCategoryMask(membership);
            body.shape.filterCollideMask = getCollideMaskFor(membership);

            /**
             * RigidBody
             */
            const rb = this.world.attach(entityId, RigidBody);
            rb.body = body;
        });

        return entityId;
    }

    private createCylinderEntity(
        height: number,
        diameter: number,
        position: Vector3,
        material: Material,
        membership: FilterCategory,
        isDynamic: boolean = false
    ): number {
        /**
         * Mesh
         */
        // TODO: Должны быть инстансы
        const mesh = CreateCylinder('staticCylinder', { height, diameter }, this.scene);
        mesh.position.copyFrom(position);

        mesh.material = material;

        /**
         * GameObject
         */
        const [entityId, go] = this.world.newEntity(GameObject);

        go.node = mesh;
        writeEntityId(mesh, entityId);

        /**
         * PhysicsBody
         */
        void this.havok.then(() => {
            const body = new PhysicsBody(
                mesh,
                isDynamic ? PhysicsMotionType.DYNAMIC : PhysicsMotionType.STATIC,
                true,
                this.scene
            );

            body.transformNode = mesh;

            body.shape = new PhysicsShapeCylinder(
                new Vector3(0, -height / 2, 0),
                new Vector3(0, height / 2, 0),
                diameter / 2,
                this.scene
            );

            body.shape.filterMembershipMask = getCategoryMask(membership);
            body.shape.filterCollideMask = getCollideMaskFor(membership);

            /**
             * RigidBody
             */
            const rb = this.world.attach(entityId, RigidBody);
            rb.body = body;
        });

        return entityId;
    }

    private createWalls() {
        const size = 128;
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

        this.createCylinderEntity(height, diameter, position, material, FilterCategory.Static);
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

        const saucerId = this.createCylinderEntity(
            saucerHeight,
            saucerDiameter,
            saucerPosition,
            material,
            FilterCategory.Thing,
            true
        );

        const cupId = this.createCylinderEntity(
            cupHeight,
            cupDiameter,
            cupPositon,
            material,
            FilterCategory.Thing,
            true
        );

        this.world.attach(saucerId, Handheld);
        this.world.attach(cupId, Handheld);
    }

    private createLightSwitch(position: Vector3, lightUniqueIds: number[]) {
        const halfSize = new Vector3(0.2, 0.2, 0.2);

        const material = new GridMaterial('lightSwitchMaterial', this.scene);
        material.mainColor = Color3.FromHSV(0, 0.5, 0.6);
        material.lineColor = Color3.FromHSV(0, 0.5, 0.4);
        material.majorUnitFrequency = 5;
        material.gridRatio = 0.01;

        const id = this.createBox(
            position.clone().subtractInPlace(halfSize),
            position.clone().addInPlace(halfSize),
            material,
            FilterCategory.Static
        );

        const lightSwitch = this.world.attach(id, LightSwitch);

        lightSwitch.lightUniqueIds.push(...lightUniqueIds);
    }

    /**
     * https://disk.yandex.ru/i/kN152Ad9vCFfWA
     */
    private createPistol(position: Vector3) {
        const length = 0.174;
        const height = 0.128;
        const width = 0.0255;

        const halfSize = new Vector3(width / 2, height / 2, length / 2);

        const material = new GridMaterial('pistolMaterial', this.scene);
        material.mainColor = Color3.FromHSV(0, 0, 0.2);
        material.lineColor = Color3.FromHSV(0, 0, 0.6);
        material.majorUnitFrequency = 5;
        material.gridRatio = 0.05;

        const id = this.createBox(
            position.clone().subtractInPlace(halfSize),
            position.clone().addInPlace(halfSize),
            material,
            FilterCategory.Thing,
            true
        );

        this.world.attach(id, Handheld);
        this.world.attach(id, Pistol);
    }
}
