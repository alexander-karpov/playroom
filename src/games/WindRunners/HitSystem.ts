import type * as THREE from 'three';
import { System, type World } from '~/ecs';
import { GameObject } from '~/components';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';

export class HitSystem extends System {
    public constructor() {
        super();
    }

    // public override onSimulate(world: World, deltaSec: number): void {
    //     const hitableIds = world.select([Hitable, GameObject]);
    //     const hitableGos = hitableIds.map((id) => world.getComponent(GameObject, id));
    //     const hitableComponents = hitableIds.map((id) => world.getComponent(Hitable, id));

    //     this.updateHitableSpheres(hitableComponents, hitableGos);

    //     for (const bulletId of world.select([Bullet, GameObject])) {
    //         const bullet = world.getComponent(Bullet, bulletId);

    //         /**
    //          * Время жизки снаряда
    //          */
    //         if (bullet.untilDeactivationSec <= 0) {
    //             this.deactivateBullet(world, bulletId);

    //             continue;
    //         }

    //         bullet.untilDeactivationSec -= deltaSec;

    //         /**
    //          * Первая проверка столкновения
    //          */
    //         const hitableIndex = this.detectHit(hitableComponents, bullet);

    //         if (hitableIndex !== -1) {
    //             this.handleHit(world, bulletId, hitableIds[hitableIndex]!);

    //             // Переходим к следующей пуле, эта попала
    //             continue;
    //         }

    //         /**
    //          * Небольшая интерполяция, чтобы пули сильно не пролетали мимо объектов
    //          *  - двигаем пулю
    //          *  - снова проверяем попадание
    //          */
    //         this.moveBullet(world, bulletId, bullet);

    //         /**
    //          * Вторая проверка
    //          */
    //         const hitableIndexMoved = this.detectHit(hitableComponents, bullet);

    //         if (hitableIndexMoved !== -1) {
    //             this.handleHit(world, bulletId, hitableIds[hitableIndexMoved]!);
    //         }
    //     }
    // }

    // private handleHit(world: World, bulletId: number, hitableId: number) {
    //     const bullet = world.getComponent(Bullet, bulletId);
    //     const hitable = world.getComponent(Hitable, hitableId);

    //     console.log(' hitable.health', hitable.health);
    //     hitable.health -= bullet.damage;
    //     console.log(' hitable.health -= bullet.damage', hitable.health);

    //     if (hitable.health <= 0) {
    //         world.deleteComponent(Hitable, hitableId);
    //     }

    //     this.deactivateBullet(world, bulletId);
    // }

    // private deactivateBullet(world: World, id: number) {
    //     const bullet = world.getComponent(Bullet, id);
    //     bullet.untilDeactivationSec = -1;

    //     if (world.hasComponent(GameObject, id)) {
    //         const go = world.getComponent(GameObject, id);
    //         go.object3d.visible = false;
    //     }
    // }

    // private updateHitableSpheres(hitableComponents: Hitable[], hitableGos: GameObject[]) {
    //     for (let i = 0; i < hitableComponents.length; i++) {
    //         const { object3d } = hitableGos[i]!;
    //         const hitable = hitableComponents[i]!;

    //         hitable.sphere.center.copy(object3d.position);
    //     }
    // }
}
