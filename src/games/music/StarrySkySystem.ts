import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { GameObject, RigibBody } from '~/components';
import * as THREE from 'three';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body, Composite, Vector, type Engine, Common } from 'matter-js';
import { Junk } from './Junk';
import { Bits as Bits } from '~/utils/Bits';
import { CollisionCategories } from './CollisionCategories';
import { SizedPointsMaterial } from './materials/SizedPointsMaterial';
import { choose } from '~/utils/choose';

export class StarrySkySystem extends System {
    private readonly particleSystem;

    private readonly geometry;

    private readonly particles = 10_000;

    public constructor(private readonly scene: THREE.Scene) {
        super();

        const shaderMaterial = new SizedPointsMaterial(
            new THREE.TextureLoader().load('./assets/sprites/disc.png'),
            true,
            false,
            true
        );

        const radius = 3200;

        this.geometry = new THREE.BufferGeometry();

        const positions = [];
        const colors = [];
        const sizes = [];

        const color = new THREE.Color();

        const point = new THREE.Vector2(0, 0);
        const center = new THREE.Vector2(0, 0);

        /**
         * Так можно получить тёмный контур круга
         * point.setX(Math.pow(Math.random(), -2) * radius);
         */

        for (let i = 0; i < this.particles; i++) {
            // point.setX((Math.sqrt(Math.random()) * 0.7 + Math.random() * 0.3) * radius);
            point.setX(Math.pow(Math.random(), 0.7) * radius);
            // point.setX((1 - Math.random() * Math.random()) * radius);
            point.setY(0);

            point.rotateAround(center, Math.random() * Math.PI * 2);

            // positions.push(THREE.MathUtils.randFloatSpread(radius) * Math.cos(Math.random()));
            // // positions.push(THREE.MathUtils.randFloatSpread(radius) * Math.random());
            // positions.push(THREE.MathUtils.randFloatSpread(radius) * Math.cos(Math.random()));

            positions.push(point.x);
            positions.push(point.y);

            // color.setHSL(i / this.particles, 1.0, 0.5);

            // colors.push(color.r, color.g, color.b);
            const l = THREE.MathUtils.randFloat(0.3, 0.8);
            colors.push(l, l, l);

            sizes.push(6 + 12 * Math.random() * Math.random() * Math.random());
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 2));
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.setAttribute(
            'size',
            new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage)
        );

        this.particleSystem = new THREE.Points(this.geometry, shaderMaterial);
        this.particleSystem.position.setZ(-1000);

        this.scene.add(this.particleSystem);
    }

    public override onSimulate(world: World, deltaS: number): void {
        const time = Date.now() * 0.0017;

        this.particleSystem.rotation.z = 0.01 * time;
        return;
        const sizeAttr = this.geometry.attributes['size'] as THREE.Float32BufferAttribute;
        const sizes = sizeAttr.array;

        for (let i = 0; i < this.particles; i++) {
            // @ts-expect-error
            sizes[i] = 10 * (1 + Math.sin(0.1 * i + time));
        }

        // @ts-expect-error
        this.geometry.attributes['size'].needsUpdate = true;
    }
}
