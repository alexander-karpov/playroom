import * as THREE from 'three';
import { SizedPointsMaterial } from '~/materials/SizedPointsMaterial';
import { type World, System } from '~/ecs';
import { type ProjectionUtil } from '~/utils/ProjectionUtil';
import { type ScreenSizeSource } from '~/utils/ScreenSizeSource';

export class DustSystem extends System {
    private readonly particleSystem;
    private readonly geometry;
    private readonly particles;
    private readonly material;

    public constructor(
        private readonly scene: THREE.Scene,
        private readonly projUtils: ProjectionUtil,
        private readonly screenSize: ScreenSizeSource
    ) {
        super();

        this.material = new SizedPointsMaterial(
            new THREE.TextureLoader().load('./assets/sprites/disc.png'),
            true,
            true,
            true
        );

        const depth = 3000;
        this.particles = 4000;
        this.geometry = new THREE.BufferGeometry();

        this.screenSize.consume((w, h) => {
            const min = new THREE.Vector3();
            const max = new THREE.Vector3();

            // Границы экрана на грубике где расмещаются самые глубокие точки
            this.projUtils.viewToWorld(-1, -1, -depth / 2, min);
            this.projUtils.viewToWorld(1, 1, -depth / 2, max);

            /**
             * Добавим чуть-чуть запаса чтобы спрайты частиц
             * успевали целиком зайти за край экрана доиз переноса по модулю
             */
            min.multiplyScalar(1.1);
            max.multiplyScalar(1.1);

            const boundWidth = max.x - min.x;
            const boundHeight = max.y - min.y;
            const numOfPoints = (boundWidth * boundHeight) / Math.pow(2, 14);
            this.material.setBounds(boundWidth, boundHeight);

            this.geometry.setDrawRange(0, Math.min(numOfPoints, this.particles));
        });

        const positions = [];
        const colors = [];
        const sizes = [];

        const color = new THREE.Color();

        for (let i = 0; i < this.particles; i++) {
            /**
             * Раскидать точки можно на любой площади т.к. всё равно
             * они будут перенесены по границам экрана
             */
            positions.push(THREE.MathUtils.randFloatSpread(10_000));
            positions.push(THREE.MathUtils.randFloatSpread(10_000));
            positions.push(THREE.MathUtils.randFloatSpread(depth));

            color.setHSL(0.5, 0.2, 1);
            colors.push(color.r, color.g, color.b);

            const size = 3 + 5 * Math.random() * Math.random() * Math.random();
            sizes.push(size);
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        this.particleSystem = new THREE.Points(this.geometry, this.material);
        this.particleSystem.frustumCulled = false;

        this.scene.add(this.particleSystem);
    }
}
