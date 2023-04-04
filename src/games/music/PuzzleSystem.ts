import { System } from '~/ecs/System';
import type { World } from '~/ecs/World';
import { Star } from './Star';
import { SoundTracks } from '~/systems/AudioSystem';
import { Active, Sound } from '~/components';
import { delay } from '~/utils/delay';
import { Hint } from './Hint';
import { choose } from '~/utils/choose';
import { type CancellationSource, coroutine } from '~/utils/coroutine';

const STARS = [
    { track: SoundTracks.XylophoneC, size: 8 },
    { track: SoundTracks.XylophoneD1, size: 7 },
    { track: SoundTracks.XylophoneE1, size: 6 },
    { track: SoundTracks.XylophoneF, size: 5 },
    { track: SoundTracks.XylophoneG, size: 4 },
    { track: SoundTracks.XylophoneA, size: 3 },
    { track: SoundTracks.XylophoneB, size: 2 },
    { track: SoundTracks.XylophoneC2, size: 1 },
];

export class PuzzleSystem extends System {
    private hintCancellation?: CancellationSource;

    @System.on([Star, Active])
    private onStarActive(world: World, entity: number): void {
        this.hintCancellation?.cancel();

        const activeStars = world.select([Star, Active]);
        const starsNo = activeStars.map((id) => world.getComponent(Star, id).numberInOrder).sort();

        // Активированные звёзды должны идти по порядку
        for (let i = 0; i < starsNo.length; i++) {
            if (starsNo[i] !== i) {
                this.deactivateAllStars(activeStars, world);
                this.playHints(world, 1000);
                return;
            }
        }

        const totalStars = world.cound([Star]);

        console.log({ totalStars, activeStars: activeStars.length });
        if (activeStars.length === totalStars) {
            // 🎉 Ураа!!1 🎉
            this.deactivateAllStars(activeStars, world);
            const randomStar = STARS[choose([0, 1, 2, 3, 4, 5, 6, 7])]!;
            this.addStar(world, totalStars, randomStar.track, randomStar.size);

            this.playHints(world, 1000);
        }
    }

    public override onCreate(world: World): void {
        for (let i = 0; i < 64; i++) {
            this.addStar(world, 0, STARS[4]!.track, STARS[4]!.size);
        }
    }

    private playHints(world: World, afterMs: number): void {
        const stars = world
            .select([Star])
            .map((en) => ({ entity: en, star: world.getComponent(Star, en) }));

        stars.sort((a, b) => a.star.numberInOrder - b.star.numberInOrder);

        this.hintCancellation = coroutine(async (token) => {
            await delay(afterMs);

            for (const { entity } of stars) {
                if (token.requested) {
                    return;
                }

                world.addComponent(Hint, entity);

                await delay(500);
            }
        });
    }

    private deactivateAllStars(activeStars: readonly number[], world: World) {
        for (const star of activeStars) {
            world.deleteComponent(Active, star);
        }
    }

    private addStar(world: World, no: number, track: SoundTracks, size: number) {
        const [, star] = world.addEntity(Star);

        star.numberInOrder = no;
        star.soundtrack = track;
        star.size = size;
    }
}
