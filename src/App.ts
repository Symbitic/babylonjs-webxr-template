import {
  AbstractMesh,
  ArcRotateCamera,
  CannonJSPlugin,
  Color3,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsImpostor,
  Scene,
  Vector3,
  WebXRDefaultExperience,
  WebXRSessionManager,

  StandardMaterial,
  WebXRInputSource,
  GlowLayer,
} from '@babylonjs/core';

import {
  AdvancedDynamicTexture,
  Control,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';

import "@babylonjs/loaders/glTF";

import * as cannon from 'cannon';

import { AbstractController } from './AbstractController';
import { ShooterController, GrabController } from './Controllers';

export default class App {
  private _engine: Engine;
  private _canvas: HTMLCanvasElement;
  private _scene?: Scene;
  private _supported: boolean;
  private _floorMeshes: AbstractMesh[] = [];
  private _experience?: WebXRDefaultExperience;
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

  private createRandomVector3() {
    const x = (Math.round(Math.random()) * 2 - 1) * Math.random() * 5;
    const y = Math.random() * 5;
    const z = (Math.round(Math.random()) * 2 - 1) * Math.random() * 5;
    return new Vector3(x, y, z);
  }

  private createObjects(count: number) {
    for (let i=0; i<count; i++) {
      const box = MeshBuilder.CreateBox(`box${i+1}`, { size: 0.1 }, this._scene);
      const sphere = MeshBuilder.CreateSphere(`sphere${i+1}`, { diameter: 0.1 }, this._scene);
      box.position = this.createRandomVector3();
      sphere.position = this.createRandomVector3();
    }
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
        { mass: 0, friction: 0.5, restitution: 0.7 },
        this._scene
      );
    });

    return physicsRoot;
  }

  async createScene(): Promise<boolean> {
    this._scene = new Scene(this._engine);

    const lightPos = new Vector3(1, 1, 0);
    const light = new HemisphericLight('light1', lightPos, this._scene);
    light.name = 'light1'; // Mostly so that TypeScript doesn't complain.

    const cameraPos = new Vector3(0, 1.2, 0);
    this._camera = new ArcRotateCamera('camera1', 0, 0, 3, cameraPos, this._scene, true);
    this._camera.position = new Vector3(0, 1.2, -1.1);
    this._camera.attachControl(this._canvas, true);
    this._camera.inputs.attached.mousewheel.detachControl();

    // Enable physics.
    this._scene.enablePhysics(null, new CannonJSPlugin(true, 10, cannon));

    const environment = this._scene.createDefaultEnvironment();
    if (!environment) {
      this._error = 'Error creating the default environment';
      return false;
    }
    environment.setMainColor(Color3.FromHexString('#74b9ff'));

    const ground1 = MeshBuilder.CreateGround('ground1', { width: 50, height: 50, subdivisions: 4 }, this._scene);
    this._floorMeshes.push(ground1);

    const plane = MeshBuilder.CreatePlane('plane', { size: 1 });
    plane.position = new Vector3(0, 1, 0);

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

    const count = Math.round(Math.random() * 20);
    this.createObjects(count);

    const physicsRoot = this.setupGravity();
    if (!physicsRoot) {
      this._error = 'Error creating gravity';
      return false;
    }

    this._supported = await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr');

    if (this._supported) {
      this._experience = await this._scene.createDefaultXRExperienceAsync({
        floorMeshes: this._floorMeshes,
        disableTeleportation: true
      });

      //const scene = this._scene;

      this._experience.input.onControllerAddedObservable.add((inputSource: WebXRInputSource) => {
        //inputSource.onMeshLoadedObservable.add((model) => {});

        //pistol.setParent(inputSource.pointer);

        inputSource.onMotionControllerInitObservable.add((motionController) => {
          /*
          motionController.onModelLoadedObservable.add((model) => {
            const name = model.handedness;
            const material = new StandardMaterial(`material-${name}`, scene);
            material.diffuseColor = name === 'left'
              ? new Color3(1, 0, 0)
              : new Color3(0, 0, 1);
            const box = MeshBuilder.CreateBox(`box-${name}`, { size: 1 }, this._scene);
            box.material = material;
            model.rootMesh = box;
          });
          */
          /*
          if (motionController.handedness === 'left') {
            const gl = new GlowLayer("glow", <Scene>this._scene, {
                mainTextureFixedSize: 512
            });
            const lightsaber = MeshBuilder.CreateCylinder('lightsaber', {
                diameter: 0.70,
                height: 12
            }, this._scene);
            lightsaber.position.set(0, 0, 90);

            const material = new StandardMaterial('glowy', <Scene>this._scene);
            material.emissiveColor = Color3.White();
            lightsaber.material = material;

            lightsaber.parent = <AbstractMesh>inputSource.grip;
          }
          */
        });
      });

      const shooterController = new ShooterController(this._experience, this._scene, physicsRoot);


      //const grabController = new GrabController(this._experience);

      this._controllers.push(shooterController);
      //this._controllers.push(grabController);
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
