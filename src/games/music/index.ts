import { Runtime } from '~/ecs';
import { changeMatterJsRandomSeed } from '~/utils/changeMatterJsRandomSeed';
import { SceneSystem } from './SceneSystem';
import { SyncPhysicsSystem } from '~/systems/SyncPhysicsSystem';
import { AudioSystem } from '~/systems/AudioSystem';
import { PuzzleSystem } from './PuzzleSystem';
import { StarsSystem } from './StarsSystem';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ProjectionHelper } from '~/utils/ProjectionHelper';
import { Engine } from 'matter-js';
import { JunkSystem } from './JunkSystem';
import { SkySystem } from './SkySystem';
import GUI from 'lil-gui';
import { initYandexSdk } from '~/yandexSdk';

changeMatterJsRandomSeed();

const yandexSdk = initYandexSdk();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight, false);
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
const camera = new THREE.OrthographicCamera();
camera.near = 1;
camera.far = 10_000;
camera.position.z = 1000;

/**
 * Resize
 */
function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height, false);

    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();
}

onResize();

window.addEventListener('resize', onResize);

/**
 * Без этого не будет работать Raycaster до первого рендеринга,
 * а это нужно в конструкторах для определения краёв экрана в
 * мировом пространстве
 */
camera.updateWorldMatrix(false, false);

/**
 * EffectComposer
 */

const composer = new EffectComposer(renderer);

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
 * Lil
 */

const lil = new GUI({ title: 'Настройки' });

if (!window.location.search.includes('debug')) {
    lil.hide();
}

/**
 * Systems
 */

const systemsRuntime = new Runtime([
    new SceneSystem(projectionHelper, scene, camera, renderer, composer, engine, lil),
    new SkySystem(projectionHelper, scene),
    new SyncPhysicsSystem(engine),
    new AudioSystem(),
    new PuzzleSystem(lil, yandexSdk),
    new StarsSystem(scene, engine, lil),
    new JunkSystem(scene, camera, engine, lil),
]);

/**
 * FPS
 */
let framesCount = 0;

const fpsConfig = {
    fps: 0,
};
const fpsLilField = lil.add(fpsConfig, 'fps');
const fpsIntervalS = 3;

setInterval(() => {
    fpsLilField.setValue((framesCount / fpsIntervalS).toFixed(0));

    framesCount = 0;
}, fpsIntervalS * 1000);

/**
 * Game loop
 */

systemsRuntime.initialize();

let lastTime = performance.now();

function animate(time: number): void {
    requestAnimationFrame(animate);

    const deltaMs = time - lastTime;
    const deltaS = deltaMs / 1000;
    lastTime = time;

    systemsRuntime.update(
        // Когда вкладка становится неактивной, в deltaS накапливается
        // очень большое время. При возвращении назад во вкладку, происходит
        // взрыв физики если передать его в таком виде
        deltaS > 0.1 ? 0.1 : deltaS
    );

    composer.render(deltaMs);

    framesCount++;
}

animate(performance.now());
void yandexSdk.then((sdk) => sdk.features.LoadingAPI?.ready());
