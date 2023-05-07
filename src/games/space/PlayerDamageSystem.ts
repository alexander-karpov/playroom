import type * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Ship } from './Ship';
import { Active, RigibBody, Sound } from '~/components';
import { Target } from './Target';
import { Hit } from './Hit';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { Body, type Engine } from 'matter-js';
import { SoundTrack } from '~/systems/AudioSystem';
import { choose } from '~/utils/choose';

const hitSoundtracks = [
    SoundTrack.BulletMetalHit01,
    SoundTrack.BulletMetalHit02,
    SoundTrack.BulletMetalHit03,
    SoundTrack.BulletMetalHit04,
    SoundTrack.BulletMetalHit05,
];

export class PlayerDamageSystem extends System {
    private lastDamageTimeMs = 0;
    private readonly healthRegenDelaySec = 3;
    private readonly healthRegenTimeSec = 6;

    public constructor(
        private readonly world: World,
        private readonly scene: THREE.Scene,
        private readonly engine: Engine
    ) {
        super();
    }

    @System.on([Player, Hit])
    private onPlayerHit(world: World, id: number) {
        world.detach(id, Hit);
        const ship = world.get(id, Ship);
        const { body } = world.get(id, RigibBody);

        ship.health -= 1;
        this.lastDamageTimeMs = Date.now();

        const sound = world.attach(id, Sound);
        sound.track = choose(hitSoundtracks);

        if (ship.health <= 0) {
            if (world.has(Active, id)) {
                world.detach(id, Active);
                Body.setPosition(body, { x: 0, y: 0 });
                ObjectPoolHelper.deactivate(world, this.engine, id);
            }

            setTimeout(() => {
                ObjectPoolHelper.activate(world, this.engine, id);
                ship.health = ship.maxHealth;
            }, 1000);
        }
    }

    public override onUpdate(world: World, deltaSec: number): void {
        this.regenHealth(deltaSec);
    }

    private regenHealth(deltaSec: number) {
        if (Date.now() - this.lastDamageTimeMs > this.healthRegenDelaySec * 1000) {
            for (const id of this.world.select([Player, Ship, Active])) {
                const ship = this.world.get(id, Ship);

                if (ship.health < ship.maxHealth) {
                    ship.health += (ship.maxHealth / this.healthRegenTimeSec) * deltaSec;
                }
            }
        }
    }
}
