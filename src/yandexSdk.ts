interface ShowFullscreenAdvParams {
    callbacks?: {
        onClose?: () => void;
        onOpen?: () => void;
        onError?: () => void;
        onOffline?: () => void;
    };
}

export interface YandexSDK {
    features: {
        LoadingAPI?: {
            ready: () => void;
        };
    };

    adv: {
        showFullscreenAdv: (params?: ShowFullscreenAdvParams) => void;
    };
}

export function initYandexSdk(): Promise<YandexSDK> {
    return new Promise((resolve, reject) => {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        window.YaGames.init()
            .then((ysdk: YandexSDK) => {
                console.log('Yandex SDK initialized');
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                resolve(ysdk);
            })
            .catch(reject);
    });
}
