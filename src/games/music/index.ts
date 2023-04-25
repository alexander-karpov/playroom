import { MusicGame } from './MusicGame';
import { initYandexSdk } from '~/yandexSdk';

const game = new MusicGame();

void initYandexSdk()
    .then((sdk) => {
        sdk.adv.showFullscreenAdv({
            callbacks: {
                onOpen: () => game.run(),
                onError: () => game.run(),
                onOffline: () => game.run(),
            },
        });
    })
    .catch(() => game.run());
