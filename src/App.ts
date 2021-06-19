import {
  AbstractMesh,
  ArcRotateCamera,
  CannonJSPlugin,
  Color3,
  DirectionalLight,
  Engine,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
  WebXRDefaultExperience,
  WebXRSessionManager,
} from '@babylonjs/core';

import { GridMaterial } from '@babylonjs/materials';

import {
  AdvancedDynamicTexture,
  Control,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';

import "@babylonjs/loaders/glTF";

import * as cannon from 'cannon';

import { AbstractController } from './AbstractController';
import { Controller } from './Controllers';

export default class App {
  private _engine: Engine;
  private _canvas: HTMLCanvasElement;
  private _scene?: Scene;
  private _supported: boolean;
  private _floorMeshes: AbstractMesh[] = [];
  private _xr?: WebXRDefaultExperience;
  private _controllers: AbstractController[] = [];
  private _error: string = '';
  private _header: TextBlock;
  private _camera?: ArcRotateCamera;

  get error() {
    return this._error;
  }

  get supported() {
    return this._supported;
  }

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this._engine = engine;
    this._canvas = canvas;
    this._supported = false;
    this._header = new TextBlock();
  }

  private setupGravity() {
    if (!this._scene) {
      return;
    }
    const gravityVector = new Vector3(0, -9.81, 0);
    this._scene.enablePhysics(gravityVector);

    const physicsRoot = new Mesh('physicsRoot', this._scene);
    physicsRoot.position.y -= 0.9;
    physicsRoot.scaling.scaleInPlace(1.0)
    physicsRoot.physicsImpostor = new PhysicsImpostor(
      physicsRoot,
      PhysicsImpostor.NoImpostor,
      { mass: 3 },
      this._scene
    );

    this._floorMeshes.forEach((ground) => {
      ground.physicsImpostor = new PhysicsImpostor(
        ground,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, friction: 0.5, restitution: 0.85 },
        this._scene
      );
    });

    return physicsRoot;
  }

  async createScene(): Promise<boolean> {
    this._scene = new Scene(this._engine);

    const lightDir = new Vector3(0, -0.5, 1.0);
    const light = new DirectionalLight('light', lightDir, this._scene);
    light.position = new Vector3(0, 5, -6);

    const lon = -Math.PI / 2;
    const lat = Math.PI / 4 + 0.8;
    const radius = 6;
    const cameraTarget = new Vector3(0, 1, 0);
    this._camera = new ArcRotateCamera('camera', lon, lat, radius, cameraTarget, this._scene);
    this._camera.position = new Vector3(0, 1.2, -1.1);
    this._camera.attachControl(this._canvas, true);
    this._camera.inputs.attached.mousewheel.detachControl();

    // Enable physics.
    this._scene.enablePhysics(null, new CannonJSPlugin(true, 10, cannon));

    const environment = this._scene.createDefaultEnvironment({ enableGroundShadow: true });
    if (!environment) {
      this._error = 'Error creating the default environment';
      return false;
    }
    environment.setMainColor(Color3.Teal());

    const ground = MeshBuilder.CreateBox('ground', {
      width: 20,
      depth: 20,
      height: 0.2
    });
    ground.position.y = -0.095
    ground.parent = null;
    ground.setAbsolutePosition(environment.ground!.getAbsolutePosition());
    ground.physicsImpostor = new PhysicsImpostor(ground, PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.85 });
    ground.receiveShadows = true;
    ground.material = new GridMaterial('mat', this._scene);

    this._floorMeshes.push(ground);

    const plane = MeshBuilder.CreatePlane('plane', { size: 1 });
    plane.position = new Vector3(0, 1, 0.5);

    const advancedTexture = AdvancedDynamicTexture.CreateForMesh(plane);
    const panel = new StackPanel();

    advancedTexture.addControl(panel);

    this._header.text = 'Text Block';
    this._header.height = '150px';
    this._header.width = '1400px';
    this._header.color = 'white';
    this._header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this._header.fontSize = '60';
    panel.addControl(this._header);

    const physicsRoot = this.setupGravity();
    if (!physicsRoot) {
      this._error = 'Error creating gravity';
      return false;
    }

    this._supported = await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr');
    if (this._supported) {
      this._xr = await this._scene.createDefaultXRExperienceAsync({
        floorMeshes: this._floorMeshes,
        disableTeleportation: true,
        uiOptions: {
          sessionMode: 'immersive-vr',
          referenceSpaceType: 'local-floor'
        },
        inputOptions: {
          // Enable to disable loading controller models.
          doNotLoadControllerMeshes: false
        }
      });

      const controller = new Controller(this._xr, this._scene, physicsRoot);
      await controller.setupLightsaber(this._xr, this._scene)
      this._controllers.push(controller);
    }

    return true;
  }

  /**
   * Create a WebXR scene.
   *
   * Extends {{@link createScene}}. If WebXR is not available, then an error
   * text block is displayed, and the function returns false.
   *
   * @returns `true` if scene was created and WebXR is available. `false` otherwise.
   */
  async createXrScene(): Promise<boolean> {
    const ret = await this.createScene();
    if (!ret) {
      return false;
    }

    if (!this._supported) {
      this._header.text = 'WebXR Not Available';
      this._header.height = '300px';
      this._header.color = 'red';
      this._header.fontSize = '80';
      this._header.resizeToFit = true;
      this._header.fontWeight = 'bold';
      this._camera?.detachControl();
      return false;
    }
    return true;
  }

  run(): void {
    if (!this._scene) {
      return;
    }
    const scene = this._scene;
    this._engine.runRenderLoop(() => {
      scene.render();
    });
  }
}
