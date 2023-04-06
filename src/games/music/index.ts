import { Runtime } from '~/ecs';
import { changeMatterJsRandomSeed } from '~/utils/changeMatterJsRandomSeed';
import { SceneSystem } from './SceneSystem';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsManagerSystem } from './StarsManagerSystem';
import * as THREE from 'three';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Engine } from 'matter-js';

changeMatterJsRandomSeed();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer();

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.z = 50;

// MatterJs плохо работает с очень маленькими цифрами
// по-этому делаем все объекты больших размеров
camera.scale.z = 0.05;

/**
 * Предварительный пустой рендер обновляет что-то в камере,
 * без чего не работает Raycaster и сложно спроецировать
 * края экрана в мировое пространство
 */
renderer.render(scene, camera);

/**
 * ProjectionHelper
 */
const projectionHelper = new ProjectionHelper(
    renderer.domElement.width,
    renderer.domElement.height,
    camera
);

/**
 * Physics
 */
const engine = Engine.create({
    gravity: { x: 0, y: 0 },
    // TODO: не работает засыпание, предметы просто зависают
    enableSleeping: false,
});

/**
 * Systems
 */

const systemsRuntime = new Runtime([
    new SceneSystem(projectionHelper, scene, camera, engine),
    new SyncPhysicsSystem(engine),
    new AudioSystem(),
    new PuzzleSystem(),
    new StarsManagerSystem(scene, engine),
]);

/**
 * Game loop
 */

systemsRuntime.initialize();

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaS = (time - lastTime) / 1000;
    lastTime = time;

    systemsRuntime.update(
        // Когда вкладка становится неактивной, в deltaS накапливается
        // очень большое время. При возвращении назад во вкладку, происходит
        // взрыв физики если передать его в таком виде
        deltaS > 0.1 ? 0.1 : deltaS
    );

    renderer.render(scene, camera);
}

animate(performance.now());
