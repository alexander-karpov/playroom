import { System, type World } from '~/ecs';
import { Target } from '../components/Target';
import { Ship } from '../components/Ship';
import { Enemy } from '../components/Enemy';
import { Active, RigibBody } from '~/games/space/components';
import { Player } from '../components/Player';
import * as THREE from 'three';
import { Body, Vector } from 'matter-js';
import { VectorEx } from '~/games/space/utils/VectorEx';

export class TargetSelectionSystem extends System {
    private readonly directionToEnemy = Vector.create();
    private readonly minDotForTarget = 0.8;
    private readonly maxDistanceToTarget = 1000;
    private readonly targetMarker: THREE.Object3D;

    public constructor(private readonly scene: THREE.Scene) {
        super();

        this.targetMarker = this.createTargetMarker();
        this.targetMarker.visible = false;
        scene.add(this.targetMarker);
    }

    public override onUpdate(world: World, deltaSec: number): void {
        this.selectTarget(world);

        this.targetMarker.visible = false;

        for (const id of world.select([Target, Active, RigibBody])) {
            const { body } = world.get(id, RigibBody);

            this.targetMarker.position.set(
                body.position.x,
                body.position.y,
                this.targetMarker.position.z
            );

            this.targetMarker.visible = true;
        }
    }

    private createTargetMarker(): THREE.Line {
        const material = new THREE.LineBasicMaterial({ color: 0x60ff00 });
        const halfSide = 64;

        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-halfSide, -halfSide, 0),
            new THREE.Vector3(halfSide, -halfSide, 0),
            new THREE.Vector3(halfSide, halfSide, 0),
            new THREE.Vector3(-halfSide, halfSide, 0),
            new THREE.Vector3(-halfSide, -halfSide, 0),
        ]);

        return new THREE.Line(geometry, material);
    }

    private selectTarget(world: World) {
        let nearestEnemyId = -1;
        let distanceSqToNearestEnemy = Number.MAX_SAFE_INTEGER;

        for (const id of world.select([Player, Ship, RigibBody, Active])) {
            const { bootsOn: engineOn, direction } = world.get(id, Ship);

            // Фиксируемся на цели когда двигатель выключен
            if (!engineOn) {
                return;
            }

            const { body } = world.get(id, RigibBody);

            for (const enemyId of world.select([Enemy, RigibBody, Active])) {
                const { body: enemyBody } = world.get(enemyId, RigibBody);

                const distanceSq = VectorEx.distanceSq(body.position, enemyBody.position);

                if (
                    distanceSq > this.maxDistanceToTarget * this.maxDistanceToTarget ||
                    distanceSq > distanceSqToNearestEnemy
                ) {
                    continue;
                }

                VectorEx.directionFrom(body.position, enemyBody.position, this.directionToEnemy);

                const dot = Vector.dot(direction, this.directionToEnemy);

                if (dot < this.minDotForTarget) {
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
            world.detach(id, Target);
        }

        if (nearestEnemyId !== -1) {
            world.attach(nearestEnemyId, Target);
        }
    }
}
