import type { Renderer, Container } from 'pixi.js';
import type { Engine } from 'matter-js';

export class Application {
    public renderer!: Renderer;
    public stage!: Container;
    public physics!: Engine;
    // public puzzle!: Puzzle;
    public touchedStarEntities!: number[];
}

// class Puzzle {
//     public tones!: [string, ...string[]];
// }
