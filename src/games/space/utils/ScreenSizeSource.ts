type ChangeScreenSizeHandler = (width: number, height: number) => void;

export class ScreenSizeSource {
    private readonly handlers: ChangeScreenSizeHandler[] = [];
    private _width = window.innerWidth;
    private _height = window.innerHeight;

    public constructor() {
        window.addEventListener('resize', (ev) => {
            this._width = window.innerWidth;
            this._height = window.innerHeight;

            for (const handler of this.handlers) {
                handler(this._width, this._height);
            }
        });
    }

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    public consume(handler: ChangeScreenSizeHandler) {
        this.handlers.push(handler);

        handler(this._width, this._height);
    }
}
