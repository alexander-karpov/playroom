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
import type GUI from 'lil-gui';
import { nameof } from '~/utils/nameof';
import type { YandexSDK } from '~/yandexSdk';

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
    private level = 1;
    private record = 0;
    private readonly recordLocalStorageKey = 'kukuruku_music_record';
    private readonly levels = [
        5, 9, 12, 15, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 50, 100,
    ];

    private isAdOpen = false;

    public constructor(private readonly lil: GUI, private readonly yandexSdk: Promise<YandexSDK>) {
        super();

        this.puzzleTune = this.composeTune(3);
        this.loadRecord();
        this.setupLil();
    }

    @System.on([Star, Touched])
    private onStarTouched(world: World, entity: number): void {
        if (this.isAdOpen) {
            return;
        }

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
                    delay = 3000;
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

                this.touchedStarNo = 0;
                this.numShouldBeRepeated = 1;
            } else {
                this.puzzleTune = this.composeTune(this.puzzleLength);

                // При первом нажатии двигаем мелодию к первой такой ноте
                const indexOfThisTone = this.puzzleTune.indexOf(star.tone);
                this.puzzleTune.splice(0, indexOfThisTone);

                this.touchedStarNo = 0;
                this.numShouldBeRepeated = 2;

                this.playPuzzleTune(world, 1000);
            }
        }
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
        if (
            !this.isAdOpen &&
            this.numShouldBeRepeated > 1 &&
            this.touchedStarNo === 0 &&
            this.lastTonePlayed !== 0 &&
            Date.now() - this.lastTonePlayed > 4000
        ) {
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
        if (this.record) {
            const recElem = this.scoreElem.querySelector('.Score-Record')!;
            recElem.innerHTML = `Рекорд&nbsp;${this.record}`;
        }

        if (this.level > 1 && this.record > 8) {
            this.isAdOpen = true;

            setTimeout(() => {
                void this.yandexSdk.then((sdk) =>
                    sdk.adv.showFullscreenAdv({
                        callbacks: {
                            onOpen: () => (this.isAdOpen = true),
                            onClose: () => (this.isAdOpen = false),
                            onError: () => (this.isAdOpen = false),
                            onOffline: () => (this.isAdOpen = false),
                        },
                    })
                );
            }, 500);
        }

        for (const entity of world.select([Star, RigibBody])) {
            const rb = world.getComponent(RigibBody, entity);
            // const force = Vector.create(0, 0.001 * rb.body.mass);
            const force = Vector.mult(
                Vector.normalise(Vector.neg(rb.body.position)),
                0.005 * rb.body.mass
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

            Body.setAngularVelocity(rb.body, 10 / rb.body.mass);
        }

        const [, sound] = world.addEntity(Sound);
        sound.name = SoundTracks.Win;
        sound.throttleMs = 0;
    }

    private updateScore(world: World) {
        const inc = 1;
        let isNewRecord = false;

        this.score = this.touchedStarNo;

        for (let i = 0; i < this.touchedStarNo; i++) {
            world.addEntity(Junk);
        }

        if (this.score > this.record) {
            this.record = this.score;
            this.saveRecord();
            isNewRecord = true;
        }

        const valueElem = this.scoreElem.querySelector('.Score-Value')!;

        valueElem.textContent = this.score.toLocaleString('ru-RU', {
            maximumFractionDigits: 2,
        });

        if (isNewRecord) {
            const recElem = this.scoreElem.querySelector('.Score-Record')!;
            recElem.innerHTML = `Новый&nbsp;рекорд&nbsp;${this.record}`;
        }
    }

    private updateLevel(level: number) {
        this.level = level;

        const valueElem = this.scoreElem.querySelector('.Score-Value')!;

        if (this.level > 1) {
            valueElem.textContent = `Уровень ${this.level}`;
        } else {
            valueElem.textContent = '👉 ⭐';
        }
    }

    private loadRecord() {
        this.record = parseInt(localStorage.getItem(this.recordLocalStorageKey) ?? '0');
        const recElem = this.scoreElem.querySelector('.Score-Record')!;

        if (this.record) {
            recElem.innerHTML = `Рекорд&nbsp;${this.record}`;
        } else {
            recElem.innerHTML = 'Для начала игры нажмите на&nbsp;звёздочку';
        }
    }

    private saveRecord() {
        localStorage.setItem(this.recordLocalStorageKey, String(this.record));
    }

    private setupLil() {
        this.lil;

        const config = {
            clearRecord: () => {
                localStorage.removeItem(this.recordLocalStorageKey);
            },
        };

        this.lil.add(config, nameof<typeof config>('clearRecord')).name('Сбросить рекорд');
    }
}
