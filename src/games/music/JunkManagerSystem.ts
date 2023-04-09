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

export class JunkManagerSystem extends System {
    public constructor(private readonly scene: THREE.Scene, private readonly engine: Engine) {
        super();
    }

    @System.on([Junk])
    private onJunk(world: World, entity: number): void {
        const angle = Math.random() * Math.PI * 2;
        const size = fib(9);
        const position = new THREE.Vector2(Common.random(-200, 200), Common.random(-200, 200));

        /**
         * Junk
         */
        const junk = world.getComponent(Junk, entity);

        junk.rotationImitationFactor = new THREE.Vector3(
            Common.random(-1.3, 1.3),
            Common.random(-1.3, 1.3),
            0
        );

        /**
         * GameObject
         */
        const go = world.addComponent(GameObject, entity);

        go.object3d = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0xf0f000 })
            // new THREE.MeshStandardMaterial({ color: 0xf0f000, roughness: 0.5, metalness: 1 })
        );

        go.object3d.position.set(position.x, position.y, -50);
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
            collisionFilter: {
                category: Bits.bit(CollisionCategories.Junk),
                mask: Bits.bit(CollisionCategories.Junk),
                // group: -1,
            },
        });
        writeEntityId(rb.body.plugin, entity);
        Body.scale(rb.body, size * 1.1, size * 1.1);

        Composite.add(this.engine.world, rb.body);
    }

    public override onSimulate(world: World, deltaS: number): void {
        for (const entity of world.select([Junk, GameObject, RigibBody])) {
            const { object3d } = world.getComponent(GameObject, entity);
            const { rotationImitationFactor } = world.getComponent(Junk, entity);
            const rb = world.getComponent(RigibBody, entity);

            object3d.rotation.x = object3d.rotation.z * rotationImitationFactor.x;
            object3d.rotation.y = object3d.rotation.z * rotationImitationFactor.y;

            const force = Vector.mult(
                Vector.normalise(Vector.neg(rb.body.position)),
                0.005 * deltaS * rb.body.mass
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
