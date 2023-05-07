import { System, type World } from '~/ecs';
import { Player } from './Player';
import { Active, GameObject, RigibBody } from '~/components';
import { Composite, type Engine, Body, Vector } from 'matter-js';
import { Enemy } from './Enemy';
import * as THREE from 'three';
import { loadGLTF } from '~/utils/loadGLTF';
import { Ship } from './Ship';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { createBodyForObject3d } from '~/utils/createBodyForObject3d';
import { CollisionCategory } from './CollisionCategory';
import { Gun } from './Gun';
import { ObjectPoolHelper } from './ObjectPoolHelper';
import { SoundTrack } from '~/systems/AudioSystem';
import { Explosion } from './Explosion';

class ExplosionSprite {
    public sprite: THREE.Sprite;
    public timeSec = 0;
    public ended = true;

    public constructor(
        public readonly map: THREE.Texture,
        public readonly tilesHoriz: number,
        public readonly tilesVert: number,
        public readonly sizeX: number,
        public readonly sizeY: number,
        public readonly durationSec: number
    ) {
        this.map.repeat.set(1 / tilesHoriz, 1 / tilesVert);

        this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: map }));
        this.sprite.scale.set(sizeX, sizeY, 1);
    }

    public play() {
        this.timeSec = 0;
        this.ended = false;
        this.sprite.visible = true;

        this.update(0);
    }

    public get currentTile(): number {
        return this.timeSec !== 0 ? Math.floor(this.timeSec / this.durationSec) : 0;
    }

    public update(deltaSec: number) {
        this.timeSec += deltaSec;
        this.ended = this.currentTile >= this.tilesHoriz * this.tilesVert;

        if (this.ended) {
            this.sprite.visible = false;
            return;
        }

        this.map.offset.x = (this.currentTile % this.tilesHoriz) / this.tilesHoriz;
        this.map.offset.y =
            (this.tilesVert - Math.floor(this.currentTile / this.tilesHoriz) - 1) / this.tilesVert;
    }
}

export class ExplosionsSystem extends System {
    private readonly sprites: ExplosionSprite[] = [];
    private map?: THREE.Texture;

    public constructor(protected readonly world: World, protected readonly scene: THREE.Scene) {
        super();

        const map = new THREE.TextureLoader().load('assets/sprites/explosion01.webp', (tex) => {
            this.map = tex;
        });
    }

    @System.on([GameObject, Explosion])
    private onGameObjectExplosion(world: World, id: number) {
        this.world.detach(id, Explosion);

        if (!this.map) {
            return;
        }

        const expl = this.allocSprite(this.map);

        const { object3d } = this.world.get(id, GameObject);
        expl.sprite.position.copy(object3d.position);
        const size = THREE.MathUtils.randFloat(512, 1024);
        expl.sprite.scale.set(size, size, 1);

        expl.play();
    }

    public override onUpdate(world: World, deltaSec: number): void {
        for (const expl of this.sprites) {
            expl.update(deltaSec);
        }
    }

    private allocSprite(tex: THREE.Texture): ExplosionSprite {
        const free = this.sprites.find((a) => a.ended);

        if (free) {
            return free;
        }

        const expl = new ExplosionSprite(tex.clone(), 8, 4, 1000, 1000, 1 / 30);
        this.sprites.push(expl);
        this.scene.add(expl.sprite);

        return expl;
    }
}
