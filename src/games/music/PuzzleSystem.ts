import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { SoundTracks } from '~/systems/AudioSystem';
import { RigibBody, Touched } from '~/components';
import { delay } from '~/utils/delay';
import { Shine } from './Shine';
import { choose } from '~/utils/choose';
import { type CancellationSource, coroutine } from '~/utils/coroutine';
import { Body, Common } from 'matter-js';
import { Vector } from 'matter-js';
import { animate } from 'popmotion';
import { Junk } from './Junk';
import { hslToRgb } from '~/utils/hslToRgb';

const TRACKS = [
    SoundTracks.XylophoneC,
    SoundTracks.XylophoneD1,
    SoundTracks.XylophoneE1,
    SoundTracks.XylophoneF,
    SoundTracks.XylophoneG,
    SoundTracks.XylophoneA,
    SoundTracks.XylophoneB,
    SoundTracks.XylophoneC2,
];

const STARS_DESC = [
    { tone: 1, track: SoundTracks.XylophoneC, size: 5 },
    // { tone: 2, track: SoundTracks.XylophoneD1, size: 7 },
    { tone: 3, track: SoundTracks.XylophoneE1, size: 4 },
    // { tone: 4, track: SoundTracks.XylophoneF, size: 5 },
    { tone: 5, track: SoundTracks.XylophoneG, size: 3 },
    // { tone: 6, track: SoundTracks.XylophoneA, size: 3 },
    { tone: 7, track: SoundTracks.XylophoneB, size: 2 },
    // { tone: 8, track: SoundTracks.XylophoneC2, size: 1 },
];

export class PuzzleSystem extends System {
    private playPuzzleCancellation?: CancellationSource;
    private puzzleTune: readonly number[];
    private touchedStarNo: number = 0;
    private numShouldBeRepeated: number = 1;
    private readonly puzzleLength = 256; // Недостижимый количество
    private score = 0;
    private readonly scoreElem = document.querySelector('.Score')!;

    public constructor() {
        super();

        this.puzzleTune = this.composeTune(3);
    }

    @System.on([Star, Touched])
    private onStarTouched(world: World, entity: number): void {
        this.playPuzzleCancellation?.cancel();

        const star = world.getComponent(Star, entity);

        if (star.tone === this.puzzleTune[this.touchedStarNo]) {
            // Нажато правильно. Едем дальше
            this.touchedStarNo++;

            this.increaseScore(world);

            if (this.touchedStarNo === this.numShouldBeRepeated) {
                this.numShouldBeRepeated++;
                this.touchedStarNo = 0;

                this.playPuzzleTune(world, 1000);
            }
        } else {
            // Ошибка

            if (this.touchedStarNo > 0) {
                this.failEffect(world);
            }

            this.touchedStarNo = 0;
            this.numShouldBeRepeated = 1;

            this.puzzleTune = this.composeTune(this.puzzleLength);
            this.playPuzzleTune(world, 1000);
        }
    }

    public override onCreate(world: World): void {
        this.numShouldBeRepeated = 1;
        this.puzzleTune = this.composeTune(this.puzzleLength);

        for (const desc of STARS_DESC) {
            this.addStar(world, desc.tone, desc.track, desc.size);
        }
    }

    private playPuzzleTune(world: World, afterMs: number, repeat: boolean = false): void {
        const starsByTone = new Map(
            world.select([Star]).map((entity) => [world.getComponent(Star, entity).tone, entity])
        );

        this.playPuzzleCancellation = coroutine(async (token) => {
            await delay(afterMs);

            for (const tone of this.puzzleTune.slice(0, this.numShouldBeRepeated)) {
                const starEntity = starsByTone.get(tone)!;

                if (token.cancellationRequested) {
                    return;
                }

                world.addComponent(Shine, starEntity);
                world.deleteComponent(Shine, starEntity);

                await delay(500);
            }

            if (repeat) {
                setTimeout(() => this.playPuzzleTune(world, 500, true));
            }
        });
    }

    private addStar(world: World, no: number, track: SoundTracks, size: number) {
        const [, star] = world.addEntity(Star);

        star.tone = no;
        star.soundtrack = track;
        star.size = size;
        star.color = hslToRgb(0.133, 1, 0.6);
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
            [1, 3, 5, 7],
            // [3, 5, 7, 8],
            // // с переносом
            // [8, 1, 3, 5],
        ];

        const tune: number[] = [];

        while (tune.length < length) {
            const cord = choose(chords)!;
            Common.shuffle(cord);
            tune.push(...cord);
            // tune.push(...[1, 3, 5, 7]);
        }

        tune.length = length;

        return tune;
    }

    // TODO перенести отсюда
    private failEffect(world: World) {
        for (const entity of world.select([Star, RigibBody])) {
            const rb = world.getComponent(RigibBody, entity);
            // const force = Vector.create(0, 0.001 * rb.body.mass);
            const force = Vector.mult(
                Vector.normalise(Vector.neg(rb.body.position)),
                0.001 * rb.body.mass
            );
            Vector.rotate(
                force,
                Common.random(0, Math.PI / 2),
                // @ts-expect-error
                force
            );
            Body.applyForce(rb.body, rb.body.position, force);
        }
    }

    private increaseScore(world: World) {
        const inc = 1 * this.touchedStarNo;

        this.score += inc;

        for (let i = 0; i < inc; i++) {
            world.addEntity(Junk);
        }

        const increaseElem =
            this.scoreElem.querySelector('.Score-Increase:not(.Score-Increase_active)') ??
            this.scoreElem.querySelector('.Score-Increase')!;

        const valueElem = this.scoreElem.querySelector('.Score-Value')!;

        valueElem.textContent = this.score.toLocaleString('ru-RU', {
            maximumFractionDigits: 2,
        });

        increaseElem.textContent = `+${inc.toLocaleString('ru-RU', {
            maximumFractionDigits: 2,
        })}`;

        animate({
            duration: 500,
            onPlay: () => increaseElem.classList.add('Score-Increase_active'),
            onComplete: () => increaseElem.classList.remove('Score-Increase_active'),
        });
    }
}
