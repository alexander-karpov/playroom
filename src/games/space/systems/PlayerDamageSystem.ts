import type * as THREE from 'three';
import { System, type World } from '~/ecs';
import { Player } from '../components/Player';
import { Ship } from '../components/Ship';
import { Active, RigibBody, Sound } from '~/games/space/components';
import { Target } from '../components/Target';
import { Hit } from '../components/Hit';
import { ObjectPoolHelper } from '../utils/ObjectPoolHelper';
import { Body, type Engine } from 'matter-js';
import { SoundTrack } from '~/games/space/systems/AudioSystem';
import { choose } from '~/utils/choose';
import { Explosion } from '../components/Explosion';

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
            setTimeout(() => {
                const sound = world.attach(id, Sound);
                sound.track = SoundTrack.Explosion02;
            }, 1);

            world.attach(id, Explosion);

            if (world.has(Active, id)) {
                world.detach(id, Active);
                Body.setPosition(body, { x: 0, y: 0 });
                ship.health = ship.maxHealth;
                ObjectPoolHelper.deactivate(world, this.engine, id);
            }
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
