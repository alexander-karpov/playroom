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
import { JunkManagerSystem } from './JunkManagerSystem';

changeMatterJsRandomSeed();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const width = renderer.domElement.width;
const height = renderer.domElement.height;

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Camera
 */
const camera = new THREE.OrthographicCamera(
    width / -2,
    width / 2,
    height / 2,
    height / -2,
    1,
    1000
);

camera.position.z = 100;

/**
 * Предварительный пустой рендер обновляет что-то в камере,
 * без чего не работает Raycaster и сложно спроецировать
 * края экрана в мировое пространство
 */
renderer.render(scene, camera);

/**
 * Light
 */
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

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
    new JunkManagerSystem(scene, engine),
]);

/**
 * Game loop
 */

systemsRuntime.initialize();

let lastTime = performance.now();
let framesCount = 0;

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

    framesCount++;
}

const elem = document.querySelector('.Fps')!;

setInterval(() => {
    elem.textContent = String((framesCount / 3).toFixed(1));

    framesCount = 0;
}, 3000);

animate(performance.now());
