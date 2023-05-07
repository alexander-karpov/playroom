import { System, type World } from '~/ecs';

import type * as THREE from 'three';

export class ScoreSystem extends System {
    public constructor(protected readonly world: World, protected readonly scene: THREE.Scene) {
        super();
    }
}
