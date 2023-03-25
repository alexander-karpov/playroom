import { Common } from 'matter-js';

export function changeMatterJsRandomSeed(): void {
    // @ts-expect-error
    if (typeof Common._seed !== 'number') {
        throw new Error('Пропало поле Common._seed');
    }

    // @ts-expect-error
    Common._seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

