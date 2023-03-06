import { type ISpritesheetFrameData, type ISpritesheetData } from 'pixi.js';

export class SpritesheetBuilder {
    private readonly frames: Record<string, ISpritesheetFrameData> = {};
    private readonly animations: Record<string, string[]> = {};

    public constructor(
        private readonly scale: string = '1',
        private readonly frameSize: number = 32
    ) { }

    public build(): ISpritesheetData {
        return {
            frames: this.frames,
            meta: { scale: this.scale },
            animations: this.animations
        };
    }

    public withAnimation(name: string, line: number, length: number): this {
        const animationFrames: string[] = [];

        for (let i = 0; i < length; i++) {
            const franeName = `${name}${i}`;

            this.frames[franeName] = this.frame(i, line);
            animationFrames.push(franeName);
        }

        this.animations[name] = animationFrames;

        return this;
    }

    private frame(n: number, line: number): ISpritesheetFrameData {
        return {
            frame: { x: 64 * n, y: 64 * line, w: 64, h: 64 }
        };
    }
}
