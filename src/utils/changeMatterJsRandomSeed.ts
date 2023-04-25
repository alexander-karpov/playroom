import { type Common } from 'matter-js';

export function changeMatterJsRandomSeed(matterJsCommonModule: Common): void {
    // @ts-expect-error
    if (typeof matterJsCommonModule._seed !== 'number') {
        throw new Error('Пропало поле Common._seed');
    }

    // @ts-expect-error
    matterJsCommonModule._seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}
