import type { Application as PixiApplication } from 'pixi.js';
import type { Engine } from 'matter-js';

export class Application {
    public pixi!: PixiApplication;
    public physics!: Engine;
}
