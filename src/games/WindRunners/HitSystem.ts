import * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';

export class HitSystem extends System {
    public constructor(private readonly scene: THREE.Scene) {
        super();
    }

    @System.on([Bullet])
    private onBullet(world: World, id: number) {
        const bullet = world.getComponent(Bullet, id);

        const reusedBulletId = this.findDeactivatedBulletId(world);

        if (reusedBulletId !== -1) {
            const reusedBullet = world.getComponent(Bullet, reusedBulletId);

            Bullet.copy(bullet, reusedBullet);

            world.deleteComponent(Bullet, id);

            this.activateBullet(world, reusedBulletId);
        } else {
            const go = world.addComponent(GameObject, id);

            go.object3d = new THREE.Mesh(
                new THREE.SphereGeometry(32),
                new THREE.MeshStandardMaterial({
                    color: 0xffff00,
                })
            );

            this.scene.add(go.object3d);

            this.activateBullet(world, id);
        }
    }

    public override onSimulate(world: World, deltaSec: number): void {
        const hitableIds = world.select([Hitable, GameObject]);
        const hitableGos = hitableIds.map((id) => world.getComponent(GameObject, id));
        const hitableComponents = hitableIds.map((id) => world.getComponent(Hitable, id));

        this.updateHitableSpheres(hitableComponents, hitableGos);

        for (const bulletId of world.select([Bullet, GameObject])) {
            const bullet = world.getComponent(Bullet, bulletId);

            /**
             * Время жизки снаряда
             */
            if (bullet.untilDeactivationSec <= 0) {
                this.deactivateBullet(world, bulletId);

                continue;
            }

            bullet.untilDeactivationSec -= deltaSec;

            /**
             * Первая проверка столкновения
             */
            const hitableIndex = this.detectHit(hitableComponents, bullet);

            if (hitableIndex !== -1) {
                this.handleHit(world, bulletId, hitableIds[hitableIndex]!);

                // Переходим к следующей пуле, эта попала
                continue;
            }

            /**
             * Небольшая интерполяция, чтобы пули сильно не пролетали мимо объектов
             *  - двигаем пулю
             *  - снова проверяем попадание
             */
            this.moveBullet(world, bulletId, bullet);

            /**
             * Вторая проверка
             */
            const hitableIndexMoved = this.detectHit(hitableComponents, bullet);

            if (hitableIndexMoved !== -1) {
                this.handleHit(world, bulletId, hitableIds[hitableIndexMoved]!);
            }
        }
    }

    private handleHit(world: World, bulletId: number, hitableId: number) {
        const bullet = world.getComponent(Bullet, bulletId);
        const hitable = world.getComponent(Hitable, hitableId);

        hitable.health -= bullet.damage;
        if (hitable.health <= 0) {
            world.deleteComponent(Hitable, hitableId);
        }
    }

    private findDeactivatedBulletId(world: World): number | -1 {
        for (const id of world.select([Bullet])) {
            const bullet = world.getComponent(Bullet, id);

            if (bullet.untilDeactivationSec <= 0) {
                return id;
            }
        }

        return -1;
    }

    private activateBullet(world: World, id: number) {
        const bullet = world.getComponent(Bullet, id);

        if (world.hasComponent(GameObject, id)) {
            const go = world.getComponent(GameObject, id);

            go.object3d.visible = true;
            go.object3d.position.copy(bullet.position);
        }
    }

    private deactivateBullet(world: World, id: number) {
        const bullet = world.getComponent(Bullet, id);
        bullet.untilDeactivationSec = -1;

        if (world.hasComponent(GameObject, id)) {
            const go = world.getComponent(GameObject, id);
            go.object3d.visible = false;
        }
    }

    private updateHitableSpheres(hitableComponents: Hitable[], hitableGos: GameObject[]) {
        for (let i = 0; i < hitableComponents.length; i++) {
            const { object3d } = hitableGos[i]!;
            const hitable = hitableComponents[i]!;

            hitable.sphere.center.copy(object3d.position);
        }
    }

    private moveBullet(world: World, bulletId: number, bullet: Bullet) {
        bullet.position.addScaledVector(bullet.direction, bullet.speed);

        const go = world.getComponent(GameObject, bulletId);
        go.object3d.position.copy(bullet.position);
    }

    private detectHit(hitableComponents: readonly Hitable[], bullet: Bullet): number | -1 {
        for (let i = 0; i < hitableComponents.length; i++) {
            const { sphere, mask: collisionMask } = hitableComponents[i]!;

            if (collisionMask == bullet.targetMask && sphere.containsPoint(bullet.position)) {
                return i;
            }
        }

        return -1;
    }
}
