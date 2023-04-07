import { animate } from 'popmotion';
import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { Active, GameObject, RigibBody, Sound, Touched } from '~/components';
import * as THREE from 'three';
import { StarGeometry } from '~/geometries/StarGeometry';
import { fib } from '~/utils/fib';
import { writeEntityId } from '~/utils/extraProps';
import { Bodies, Body, Composite, Vector, type Engine, Common } from 'matter-js';
import { isMesh } from '~/utils/isMesh';
import { Shine } from './Shine';
import { isMeshBasicMaterial } from '~/utils/isMeshBasicMaterial';
import { Junk } from './Junk';

export class JunkManagerSystem extends System {
    private readonly starGeom = new StarGeometry(1);
    private readonly activeStarColor = new THREE.Color(0xff0000);

    public constructor(private readonly scene: THREE.Scene, private readonly engine: Engine) {
        super();
    }

    @System.on([Junk])
    private onJunk(world: World, entity: number): void {
        const angle = Math.random() * Math.PI * 2;
        const size = fib(9);
        const position = new THREE.Vector2(0, 0);

        /**
         * GameObject
         */
        const go = world.addComponent(GameObject, entity);

        go.object3d = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0xf0f000 })
        );

        go.object3d.position.set(position.x, position.y, 0);
        go.object3d.rotation.z = angle;
        go.object3d.scale.multiplyScalar(size);
        writeEntityId(go.object3d.userData, entity);

        this.scene.add(go.object3d);

        /**
         * Body
         */
        const rb = world.addComponent(RigibBody, entity);

        rb.body = Bodies.rectangle(position.x, position.y, 1, 1, {
            angle: angle,
        });
        writeEntityId(rb.body.plugin, entity);
        Body.scale(rb.body, size, size);

        Composite.add(this.engine.world, rb.body);
    }

    public override onCreate(world: World): void {
        let i = 10;
        while (i--) {
            const [e, junk] = world.addEntity(Junk);
            junk.rotationImitationFactor = new THREE.Vector3(
                Common.random(-1.3, 1.3),
                Common.random(-1.3, 1.3),
                0
            );
        }
    }

    public override onSimulate(world: World, deltaS: number): void {
        for (const entity of world.select([Junk, GameObject, RigibBody])) {
            const { object3d } = world.getComponent(GameObject, entity);
            const { rotationImitationFactor } = world.getComponent(Junk, entity);
            const rb = world.getComponent(RigibBody, entity);

            object3d.rotation.x = object3d.rotation.z * rotationImitationFactor.x;
            object3d.rotation.y = object3d.rotation.z * rotationImitationFactor.y;

            // const force = Vector.create(0, 0.001 * rb.body.mass);
            const force = Vector.mult(
                Vector.normalise(Vector.neg(rb.body.position)),
                0.01 * deltaS * rb.body.mass
            );

            Vector.rotate(
                force,
                Common.random(0, Math.PI / 2),
                // @ts-expect-error
                force
            );
            Body.applyForce(rb.body, rb.body.position, force);
        }
    }
}
