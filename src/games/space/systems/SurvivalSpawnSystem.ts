import { type World } from '~/ecs';
import { type Engine } from 'matter-js';
import type * as THREE from 'three';
import { SpawnSystem } from './SpawnSystem';
import { Player } from '../components/Player';
import { Active } from '~/games/space/components';
import { Enemy } from '../components/Enemy';

export class SurvivalSpawnSystem extends SpawnSystem {
    private survivalTimeSec;

    public constructor(world: World, scene: THREE.Scene, engine: Engine) {
        super(world, scene, engine);
        this.survivalTimeSec = 0;

        world.onAttach([Player, Active], (world, id) => {
            this.survivalTimeSec = 0;
        });

        world.onDetach([Enemy, Active], (world, id) => {
            this.survivalTimeSec = Math.max(this.survivalTimeSec - 1, 0);
        });
    }

    public override onUpdate(world: World, deltaSec: number): void {
        this.survivalTimeSec += deltaSec;
    }

    protected override difficulty(): number {
        return Math.floor(this.survivalTimeSec) / 3 + 3;
    }
}
