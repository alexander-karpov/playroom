import { type World } from '~/ecs';
import { type Engine } from 'matter-js';
import type * as THREE from 'three';
import { SpawnSystem } from './SpawnSystem';
import { Player } from './Player';
import { Active } from '~/components';
import { Enemy } from './Enemy';

export class SurvivalSpawnSystem extends SpawnSystem {
    private startTimeMs;

    public constructor(world: World, scene: THREE.Scene, engine: Engine) {
        super(world, scene, engine);
        this.startTimeMs = Date.now();

        world.onAttach([Player, Active], (world, id) => {
            this.startTimeMs = Date.now();
        });

        world.onDetach([Enemy, Active], (world, id) => {
            this.startTimeMs = Math.min(this.startTimeMs + 1000, Date.now());
        });
    }

    protected override difficulty(): number {
        return Math.floor((Date.now() - this.startTimeMs) / 1000);
    }
}
