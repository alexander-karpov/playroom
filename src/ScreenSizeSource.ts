type ChangeScreenSizeHandler = (width: number, height: number) => void;

export class ScreenSizeSource {
    private readonly handlers: ChangeScreenSizeHandler[] = [];
    private width = window.innerWidth;
    private height = window.innerHeight;

    public constructor() {
        window.addEventListener('resize', (ev) => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            for (const handler of this.handlers) {
                handler(this.width, this.height);
            }
        });
    }

    public subscribe(handler: ChangeScreenSizeHandler) {
        this.handlers.push(handler);

        handler(this.width, this.height);
    }
}
