import { System, type World } from '~/ecs';

import type * as THREE from 'three';
import { Enemy } from '../components/Enemy';
import { Explosion } from '../components/Explosion';
import { Player } from '../components/Player';
import { Active } from '~/games/space/components';

export const MAX_SCORE_KEY = 'kukuruku_max_space_score';

export class ScoreSystem extends System {
    private score: number = 0;
    private maxScore: number;

    public constructor(protected readonly world: World, protected readonly scene: THREE.Scene) {
        super();

        this.maxScore = Number(window.localStorage.getItem(MAX_SCORE_KEY) ?? 0);
        this.updateEntity();
    }

    @System.on([Enemy, Explosion])
    private onEnemyExplosion(world: World, id: number) {
        this.score += 1;

        if (this.score > this.maxScore) {
            this.maxScore = this.score;
            window.localStorage.setItem(MAX_SCORE_KEY, String(this.maxScore));
        }

        this.updateEntity();
    }

    @System.on([Player, Active])
    private onPlayerActive(world: World, id: number) {
        this.score = 0;
        this.updateEntity();
    }

    private updateEntity() {
        for (const id of this.world.select([Player])) {
            const player = this.world.get(id, Player);

            player.score = this.score;
            player.maxScore = this.maxScore;
        }
    }
}
