import { System } from '~/ecs/System';
import * as THREE from 'three';
import { SizedPointsMaterial } from '~/materials/SizedPointsMaterial';

export class DustSystem extends System {
    private readonly particleSystem;
    private readonly geometry;
    private readonly particles;

    public constructor(private readonly scene: THREE.Scene) {
        super();

        const shaderMaterial = new SizedPointsMaterial(
            new THREE.TextureLoader().load('./assets/sprites/disc.png'),
            true,
            false,
            true
        );

        const radius = 4000;
        this.particles = radius * 2;

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
            positions.push(THREE.MathUtils.randFloatSpread(3000));

            color.setHSL(0.5, 0.2, 1);
            colors.push(color.r, color.g, color.b);

            const size = 3 + 5 * Math.random() * Math.random() * Math.random();
            sizes.push(size);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        this.particleSystem = new THREE.Points(this.geometry, shaderMaterial);

        this.scene.add(this.particleSystem);
    }
}
