import { System, type World } from '~/ecs';
import { Target } from './Target';
import { Ship } from './Ship';
import { Enemy } from './Enemy';
import { Active, RigibBody } from '~/components';
import { Player } from './Player';
import * as THREE from 'three';

export class TargetSelectionSystem extends System {
    private readonly directionToEnemy = new THREE.Vector3();
    private readonly maxAngleToTarget = Math.PI / 4;
    private readonly maxDistanceToTarget = 500;
    private readonly targetMarker: THREE.Object3D;

    public constructor(private readonly scene: THREE.Scene) {
        super();

        this.targetMarker = new THREE.Mesh(
            new THREE.PlaneGeometry(64, 64),
            new THREE.MeshBasicMaterial({
                color: 0x60f000,
                transparent: false,
                depthTest: false,
                depthWrite: false,
            })
        );

        this.targetMarker.visible = false;

        scene.add(this.targetMarker);
    }

    public override onSimulate(world: World, deltaSec: number): void {
        this.selectTarget(world);

        this.targetMarker.visible = false;

        for (const id of world.select([Target, Active, RigibBody])) {
            const { body } = world.getComponent(RigibBody, id);

            this.targetMarker.position.set(
                body.position.x,
                body.position.y,
                this.targetMarker.position.z
            );

            this.targetMarker.visible = true;
        }
    }

    private selectTarget(world: World) {
        let nearestEnemyId = -1;
        let distanceSqToNearestEnemy = Number.MAX_SAFE_INTEGER;

        for (const id of world.select([Player, Ship, RigibBody, Active])) {
            const ship = world.getComponent(Ship, id);

            // Фиксируемся на цели когда двигатель выключен
            if (!ship.engineOn) {
                return;
            }

            const { body } = world.getComponent(RigibBody, id);

            for (const enemyId of world.select([Enemy, RigibBody, Active])) {
                const { body: enemyBody } = world.getComponent(RigibBody, enemyId);

                const distanceSq = go.object3d.position.distanceToSquared(
                    enemyGo.object3d.position
                );

                if (
                    distanceSq > this.maxDistanceToTarget * this.maxDistanceToTarget ||
                    distanceSq > distanceSqToNearestEnemy
                ) {
                    continue;
                }

                this.directionToEnemy
                    .copy(enemyGo.object3d.position)
                    .sub(go.object3d.position)
                    .normalize();

                const angle = ship.direction.angleTo(this.directionToEnemy);

                if (angle > this.maxAngleToTarget) {
                    continue;
                }

                nearestEnemyId = enemyId;
                distanceSqToNearestEnemy = distanceSq;
            }
        }

        const currentTarget = world.select([Target]);

        if (currentTarget.includes(nearestEnemyId)) {
            return;
        }

        for (const id of currentTarget) {
            world.deleteComponent(Target, id);
        }

        if (nearestEnemyId !== -1) {
            world.addComponent(Target, nearestEnemyId);
        }
    }
}
