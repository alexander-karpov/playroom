import type { Vector } from 'matter-js';

export class Controller {
    public pointer!: Vector;
    public pointerPressed!: boolean;

    public topPressed!: boolean;
    public rightPressed!: boolean;
    public bottomPressed!: boolean;
    public leftPressed!: boolean;
}