import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { RigibBody } from '~/components';
import * as THREE from 'three';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body, Composite, Vector, type Engine, Common } from 'matter-js';
import { Junk } from './Junk';
import { Bits as Bits } from '~/utils/Bits';
import { CollisionCategories } from './CollisionCategories';
import type GUI from 'lil-gui';
import { nameof } from '~/utils/nameof';

export class JunkSystem extends System {
    private readonly particleSystem;
    private readonly geometry;
    private readonly particles = 256; // Недостижимое количество я надеюсь
    private readonly positionAttr: THREE.Float32BufferAttribute;
    private readonly pointsMaterial: THREE.PointsMaterial;
    private readonly pointsSize = 10;
    private readonly camera: THREE.OrthographicCamera;

    public constructor(
        private readonly scene: THREE.Scene,
        camera: THREE.Camera,
        private readonly engine: Engine,
        private readonly lil: GUI
    ) {
        super();

        this.camera = camera as THREE.OrthographicCamera;

        const sprite = new THREE.TextureLoader().load('./assets/sprites/disc.png');

        this.pointsMaterial = new THREE.PointsMaterial({
            size: this.pointsSize,
            sizeAttenuation: true,
            map: sprite,
            alphaTest: 0.5,
            transparent: true,
            vertexColors: true,
        });

        this.geometry = new THREE.BufferGeometry();

        const positions = [];
        const colors = [];
        const tempColor = new THREE.Color();

        for (let i = 0; i < this.particles; i++) {
            positions.push(0, 0);

            const hd = i % 10 === 0 && i !== 0 ? -0.1 : 0;

            tempColor.setHSL(0.13 + hd, 1, 0.5);
            colors.push(tempColor.r, tempColor.g, tempColor.b);
        }

        this.positionAttr = new THREE.Float32BufferAttribute(positions, 2);
        this.positionAttr.count = 0;
        this.positionAttr.setUsage(THREE.DynamicDrawUsage);

        this.geometry.setAttribute('position', this.positionAttr);
        this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        this.particleSystem = new THREE.Points(this.geometry, this.pointsMaterial);
        this.particleSystem.position.setZ(-500);
        this.scene.add(this.particleSystem);
    }

    @System.on([Junk])
    private onJunk(world: World, entity: number): void {
        if (world.count([Junk]) >= this.particles) {
            world.deleteComponent(Junk, entity);
            return;
        }

        const angle = Math.random() * Math.PI * 2;
        const position = new THREE.Vector2(Common.random(-200, 200), Common.random(-200, 200));

        /**
         * Junk
         */
        const junk = world.getComponent(Junk, entity);

        junk.flyDirection = new THREE.Vector2(
            Common.random(-1.3, 1.3),
            Common.random(-1.3, 1.3)
        ).normalize();

        /**
         * Body
         */
        const rb = world.addComponent(RigibBody, entity);

        rb.body = Bodies.rectangle(position.x, position.y, 1, 1, {
            angle: angle,
            collisionFilter: {
                category: Bits.bit(CollisionCategories.Junk),
                mask: Bits.bit2(CollisionCategories.Junk, CollisionCategories.Star),
            },
        });
        writeEntityId(rb.body.plugin, entity);
        Body.scale(
            rb.body,
            this.pointsSize * THREE.MathUtils.randFloat(1, 2),
            this.pointsSize * THREE.MathUtils.randFloat(1, 2)
        );

        Composite.add(this.engine.world, rb.body);
    }

    public override onCreate(world: World): void {
        this.setupLil(world);
    }

    public override onSimulate(world: World, deltaS: number): void {
        const entities = world.select([Junk, RigibBody]);
        const particlesCountLimited = Math.min(entities.length, this.particles);

        this.positionAttr.count = particlesCountLimited;

        this.pointsMaterial.size = this.pointsSize * this.camera.zoom;

        for (let i = 0; i < particlesCountLimited; i++) {
            const entity = entities[i]!;

            const rb = world.getComponent(RigibBody, entity);
            const junk = world.getComponent(Junk, entity);

            const force2 = Vector.mult(junk.flyDirection, deltaS * rb.body.mass * 0.005);

            Body.applyForce(rb.body, rb.body.position, force2);

            // @ts-expect-error
            this.positionAttr.array[i * 2] = rb.body.position.x;
            // @ts-expect-error
            this.positionAttr.array[i * 2 + 1] = rb.body.position.y;

            // Назад
            if (Vector.magnitudeSquared(rb.body.position) > 5_198_384) {
                junk.flyDirection = Vector.normalise(Vector.neg(rb.body.position));
            }
        }

        this.positionAttr.needsUpdate = true;
    }

    private setupLil(world: World) {
        this.lil;

        const config = {
            addJunk: () => {
                let i = 100;
                while (i--) {
                    world.addEntity(Junk);
                }
            },
        };

        this.lil.add(config, nameof<typeof config>('addJunk')).name('Добавить хлама');
    }
}
