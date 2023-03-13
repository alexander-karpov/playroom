import { Runtime } from './ecs';
import { ApplicationSystem, MouseSystem, SceneSystem } from './core';
import { Ticker } from 'pixi.js';

const game = new Runtime([
    new ApplicationSystem(),
    new MouseSystem(),
    new SceneSystem(),
]);

Ticker.shared.add(function() {
    const deltaS = Ticker.shared.deltaMS / 1000;
    game.update(deltaS);
});
