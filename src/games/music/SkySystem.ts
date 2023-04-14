import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import * as THREE from 'three';
import { SizedPointsMaterial } from './materials/SizedPointsMaterial';
import type { ProjectionHelper } from '~/utils/ProjectionHelper';

export class SkySystem extends System {
    private readonly particleSystem;
    private readonly geometry;
    private readonly particles;

    public constructor(
        private readonly projectionHelper: ProjectionHelper,
        private readonly scene: THREE.Scene
    ) {
        super();

        const shaderMaterial = new SizedPointsMaterial(
            new THREE.TextureLoader().load('./assets/sprites/disc.png'),
            true,
            false,
            true
        );

        const radius = this.screenDiameterInWorld() / 2;

        this.particles = radius * 10;

        this.geometry = new THREE.BufferGeometry();

        const positions = [];
        const colors = [];
        const sizes = [];

        const point = new THREE.Vector2(0, 0);
        const center = new THREE.Vector2(0, 0);

        /**
         * Так можно получить тёмный контур круга
         * point.setX(Math.pow(Math.random(), -2) * radius);
         */

        const color = new THREE.Color();

        for (let i = 0; i < this.particles; i++) {
            /**
             * Сложение двух random даёт более-менее ровное
             * распределение в центре с сильным убыванием по краям
             * При этом radius умножается он 0 до 2, что захватывает
             * и область зума тоже
             *  0.95 чтобы видно было контур круга при зуме
             */
            point.setX((Math.random() + Math.random()) * radius * 0.95);
            point.setY(0);

            point.rotateAround(center, Math.random() * Math.PI * 2);

            positions.push(point.x);
            positions.push(point.y);

            const l = THREE.MathUtils.randFloat(0.5, 1);
            color.setHSL(0.63, 0, l);
            colors.push(color.r, color.g, color.b);

            const size = 5 + 20 * Math.random() * Math.random() * Math.random();
            sizes.push(size / 2);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 2));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        this.particleSystem = new THREE.Points(this.geometry, shaderMaterial);
        this.particleSystem.position.setZ(-1000);

        this.scene.add(this.particleSystem);
    }

    public override onSimulate(world: World, deltaS: number): void {
        const time = Date.now() * 0.0017;
        this.particleSystem.rotation.z = 0.01 * time;
    }

    private screenDiameterInWorld(): number {
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        this.projectionHelper.viewToWorld(-1, -1, a);
        this.projectionHelper.viewToWorld(1, 1, b);

        return b.distanceTo(a);
    }
}
