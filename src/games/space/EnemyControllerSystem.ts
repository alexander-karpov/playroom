import { System, type World } from '~/ecs';
import { Player } from './components/Player';
import { Ship } from './components/Ship';
import { Enemy } from './components/Enemy';
import { Active, GameObject, Sound } from '~/games/space/components';
import { Hit } from './components/Hit';
import { type Engine } from 'matter-js';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { Target } from './components/Target';
import { SoundTrack } from '~/systems/AudioSystem';
import { choose } from '~/utils/choose';
import { Explosion } from './components/Explosion';

const hitSoundtracks = [
    SoundTrack.BulletMetalHit01,
    SoundTrack.BulletMetalHit02,
    SoundTrack.BulletMetalHit03,
    SoundTrack.BulletMetalHit04,
    SoundTrack.BulletMetalHit05,
];

export class EnemyControllerSystem extends System {
    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();
    }

    @System.on([Enemy, Hit])
    private onEnemyHit(world: World, id: number) {
        world.detach(id, Hit);

        const ship = this.world.get(id, Ship);

        ship.health -= 1;

        const sound = world.has(Sound, id) ? world.get(id, Sound) : world.attach(id, Sound);
        sound.track = choose(hitSoundtracks);

        if (ship.health <= 0) {
            setTimeout(() => {
                const sound = world.has(Sound, id) ? world.get(id, Sound) : world.attach(id, Sound);
                sound.track = SoundTrack.Explosion02;
            }, 1);
            world.attach(id, Explosion);

            ObjectPoolHelper.deactivate(world, this.engine, id);

            if (world.has(Target, id)) {
                world.detach(id, Target);
            }
        }
    }

    public override onUpdate(world: World, deltaS: number): void {
        for (const enemyId of world.select([Enemy, Ship, Active])) {
            const enemyGo = world.get(enemyId, GameObject);
            const enemy = world.get(enemyId, Enemy);
            const { targetDirection } = world.get(enemyId, Ship);

            enemy.untilTurnSec += deltaS;

            if (enemy.untilTurnSec > enemy.turnDelaySec) {
                enemy.untilTurnSec = 0;

                for (const playerId of world.select([Player, Ship])) {
                    const playerGo = world.get(playerId, GameObject);

                    targetDirection
                        .copy(playerGo.object3d.position)
                        .sub(enemyGo.object3d.position)
                        .normalize();
                }
            }
        }
    }
}
