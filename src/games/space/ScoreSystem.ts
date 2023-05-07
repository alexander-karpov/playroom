import { System, type World } from '~/ecs';

import type * as THREE from 'three';
import { Enemy } from './Enemy';
import { Explosion } from './Explosion';
import { Player } from './Player';

export class ScoreSystem extends System {
    private score: number = 0;
    private maxScore: number;

    private readonly maxScoreKey: string = 'kukuruku_max_space_score';

    public constructor(protected readonly world: World, protected readonly scene: THREE.Scene) {
        super();

        this.maxScore = Number(window.localStorage.getItem(this.maxScoreKey) ?? 0);
    }

    @System.on([Enemy, Explosion])
    private onEnemyExplosion(world: World, id: number) {
        this.score += 1;

        if (this.score > this.maxScore) {
            this.maxScore = this.score;
            window.localStorage.setItem(this.maxScoreKey, String(this.maxScore));
        }

        for (const id of this.world.select([Player])) {
            const player = this.world.get(id, Player);

            player.score = this.score;
        }
    }
}
