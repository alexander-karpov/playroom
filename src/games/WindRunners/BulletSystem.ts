import { System, type World } from '~/ecs';
import { Player } from './Player';
import { GameObject } from '~/components';
import { Bullet } from './Bullet';
import { Hitable } from './Hitable';

export class BulletSystem extends System {
    public override onSimulate(world: World, deltaS: number): void {
        const hitableIds = world.select([Hitable, GameObject]);
        const hitableGos = hitableIds.map((id) => world.getComponent(GameObject, id));
        const hitableComponents = hitableIds.map((id) => world.getComponent(Hitable, id));

        this.updateHitableSpheres(hitableComponents, hitableGos);

        for (const bulletId of world.select([Bullet])) {
            const bullet = world.getComponent(Bullet, bulletId);
            const hitableIndex = this.detectHit(hitableComponents, bullet);

            if (hitableIndex !== -1) {
                console.log('hit!', hitableIds[hitableIndex]);

                // Переходим к следующей пуле, эта попала
                continue;
            }

            /**
             * Небольшая интерполяция, чтобы пули сильно не пролетали мимо объектов
             *  - двигаем пулю
             *  - снова проверяем попадание
             */
            this.moveBullet(world, bulletId, bullet);

            const hitableIndexMoved = this.detectHit(hitableComponents, bullet);

            if (hitableIndexMoved !== -1) {
                console.log('hit moved!', hitableIds[hitableIndexMoved]);
            }
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
            const { sphere } = hitableComponents[i]!;

            if (sphere.containsPoint(bullet.position)) {
                return i;
            }
        }

        return -1;
    }
}
