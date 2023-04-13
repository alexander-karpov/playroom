import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { SoundTracks } from '~/systems/AudioSystem';
import { RigibBody, Sound, Touched } from '~/components';
import { delay } from '~/utils/delay';
import { Shine } from './Shine';
import { choose } from '~/utils/choose';
import { type CancellationSource, coroutine } from '~/utils/coroutine';
import { Body, Common } from 'matter-js';
import { Vector } from 'matter-js';
import { animate } from 'popmotion';
import { Junk } from './Junk';

const STARS_DESC = [
    { tone: 1, track: SoundTracks.XylophoneC, size: 4 },
    { tone: 2, track: SoundTracks.XylophoneD1, size: 2 },
    { tone: 3, track: SoundTracks.XylophoneE1, size: 3 },
    { tone: 4, track: SoundTracks.XylophoneF, size: 4 },
    { tone: 5, track: SoundTracks.XylophoneG, size: 2 },
    { tone: 6, track: SoundTracks.XylophoneA, size: 3 },
    { tone: 7, track: SoundTracks.XylophoneB, size: 1 },
    { tone: 8, track: SoundTracks.XylophoneC2, size: 1 },
];

export class PuzzleSystem extends System {
    private playPuzzleCancellation?: CancellationSource;
    private puzzleTune: number[];
    private touchedStarNo: number = 0;
    private numShouldBeRepeated: number = 1;
    private readonly puzzleLength = 256; // Недостижимый количество
    private score = 0;
    private readonly scoreElem = document.querySelector('.Score')!;
    private lastTonePlayed = 0;
    private gameStarted = false;
    private level = 1;
    private readonly levels = [
        5, 9, 12, 15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 50, 100,
    ];

    public constructor() {
        super();

        this.puzzleTune = this.composeTune(3);
    }

    @System.on([Star, Touched])
    private onStarTouched(world: World, entity: number): void {
        this.playPuzzleCancellation?.cancel();
        this.lastTonePlayed = Date.now();

        const star = world.getComponent(Star, entity);

        if (star.tone === this.puzzleTune[this.touchedStarNo]) {
            // Нажато правильно. Едем дальше
            this.touchedStarNo++;

            this.updateScore(world);

            if (this.touchedStarNo === this.numShouldBeRepeated) {
                let delay = 0;

                if (this.levels.includes(this.numShouldBeRepeated)) {
                    delay = 1000;
                    this.nextLevelEffect(world);
                    this.updateLevel(this.level + 1);
                }

                setTimeout(() => {
                    this.numShouldBeRepeated++;
                    this.touchedStarNo = 0;

                    this.playPuzzleTune(world, 800);
                }, delay);
            }
        } else {
            // Ошибка

            if (this.numShouldBeRepeated > 1) {
                this.failEffect(world);
                this.updateLevel(1);
            }

            this.puzzleTune = this.composeTune(this.puzzleLength);

            if (this.gameStarted) {
                this.touchedStarNo = 0;
                this.numShouldBeRepeated = 1;
            } else {
                // При первом нажатии двигаем мелодию к первой такой ноте
                const indexOfThisTone = this.puzzleTune.indexOf(star.tone);
                this.puzzleTune.splice(0, indexOfThisTone);

                this.touchedStarNo = 0;
                this.numShouldBeRepeated = 2;
            }

            this.playPuzzleTune(world, this.gameStarted ? 2000 : 1000);
        }

        this.gameStarted = true;
    }

    public override onCreate(world: World): void {
        this.puzzleTune = this.composeTune(this.puzzleLength);

        for (const desc of STARS_DESC) {
            if (this.puzzleTune.includes(desc.tone)) {
                this.addStar(world, desc.tone, desc.track, desc.size);
            }
        }
    }

    public override onSometimes(world: World): void {
        if (this.lastTonePlayed !== 0 && Date.now() - this.lastTonePlayed > 2000) {
            this.lastTonePlayed = Date.now();
            this.playPuzzleCancellation?.cancel();
            this.playPuzzleTune(world, 0, false);
        }
    }

    private playPuzzleTune(world: World, afterMs: number, repeat: boolean = false): void {
        const starsByTone = new Map(
            world.select([Star]).map((entity) => [world.getComponent(Star, entity).tone, entity])
        );

        this.playPuzzleCancellation?.cancel();
        this.playPuzzleCancellation = coroutine(async (token) => {
            await delay(afterMs);

            if (token.cancellationRequested) {
                return;
            }

            for (const tone of this.puzzleTune.slice(0, this.numShouldBeRepeated)) {
                const starEntity = starsByTone.get(tone)!;

                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (token.cancellationRequested) {
                    return;
                }

                world.addComponent(Shine, starEntity);
                world.deleteComponent(Shine, starEntity);
                this.lastTonePlayed = Date.now();

                await delay(500);
            }

            if (repeat) {
                setTimeout(() => {
                    if (token.cancellationRequested) {
                        return;
                    }

                    this.playPuzzleTune(world, 1000);
                });
            }
        });
    }

    private addStar(world: World, no: number, track: SoundTracks, size: number) {
        const [, star] = world.addEntity(Star);

        star.tone = no;
        star.soundtrack = track;
        star.size = size;
    }

    private composeTune(length: number): number[] {
        const chords = [
            // Мажорные трезвучия
            // [1, 3, 5],
            // [4, 6, 8],
            // // с переносом
            // [2, 4, 6],
            // Минорные трезвучия
            // Большой мажорный септакорд
            [3, 5, 7],
            // [3, 5, 7, 8],
            // // с переносом
            // [8, 1, 3, 5],
        ];

        const tune: number[] = [];

        while (tune.length < length) {
            const cord = choose(chords)!;
            Common.shuffle(cord);
            tune.push(...cord);
        }

        tune.length = length;

        return tune;
    }

    private failEffect(world: World) {
        for (const entity of world.select([Star, RigibBody])) {
            const rb = world.getComponent(RigibBody, entity);
            // const force = Vector.create(0, 0.001 * rb.body.mass);
            const force = Vector.mult(
                Vector.normalise(Vector.neg(rb.body.position)),
                0.03 * rb.body.mass
            );
            Vector.rotate(
                force,
                Common.random(0, Math.PI / 2),
                // @ts-expect-error
                force
            );
            Body.applyForce(rb.body, rb.body.position, force);
        }

        const [, sound] = world.addEntity(Sound);
        sound.name = SoundTracks.Loss;
        sound.throttleMs = 0;
    }

    private nextLevelEffect(world: World) {
        for (const entity of world.select([Star, RigibBody])) {
            const rb = world.getComponent(RigibBody, entity);

            Body.setAngularVelocity(rb.body, 50 / rb.body.mass);
        }

        const [, sound] = world.addEntity(Sound);
        sound.name = SoundTracks.Win;
        sound.throttleMs = 0;
    }

    private updateScore(world: World) {
        const inc = 1;

        this.score = this.touchedStarNo;

        for (let i = 0; i < this.touchedStarNo; i++) {
            world.addEntity(Junk);
        }

        const valueElem = this.scoreElem.querySelector('.Score-Value')!;

        valueElem.textContent = this.score.toLocaleString('ru-RU', {
            maximumFractionDigits: 2,
        });
    }

    private updateLevel(level: number) {
        this.level = level;

        const valueElem = this.scoreElem.querySelector('.Score-Value')!;

        valueElem.textContent = `Уровень ${this.level}`;
    }
}
