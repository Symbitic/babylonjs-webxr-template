import {
  AbstractMesh,
  ArcRotateCamera,
  CannonJSPlugin,
  Color3,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Nullable,
  PhysicsImpostor,
  Scene,
  Vector3,
  WebXRAbstractMotionController,
  WebXRDefaultExperience,
  WebXRInputSource,
  WebXRSessionManager
} from '@babylonjs/core';

import {
  AdvancedDynamicTexture,
  Control,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';

import * as cannon from 'cannon';

import AbstractOculusQuestController from './AbstractOculusQuestController';
import { OculusQuestShooterController } from './Controllers';

export default class App {
  private _engine: Engine;
  private _canvas: HTMLCanvasElement;
  private _scene?: Scene;
  private _supported: boolean;
  private _floorMeshes: AbstractMesh[] = [];
  private _experience?: WebXRDefaultExperience;
  private _controllers: AbstractOculusQuestController[] = [];
  private _error: string = '';

  get error() {
    return this._error;
  }

  constructor(engine: Engine, canvas: HTMLCanvasElement) {
    this._engine = engine;
    this._canvas = canvas;
    this._supported = false;
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

  private onMotionControllerInput(inputSource: WebXRInputSource, controller: WebXRAbstractMotionController) {
    if (!this._experience || !this._experience.pointerSelection.getMeshUnderPointer) {
      return;
    }
    const experience = this._experience;
    let grabbedMesh: Nullable<AbstractMesh> = null;
    let originalPosition: Nullable<Vector3> = null;
    const triggerComponent = controller.getComponent('xr-standard-trigger');

    triggerComponent.onButtonStateChangedObservable.add((component) => {
      if (component.value > 0.8 && component.pressed) {
        if (!controller.rootMesh) {
          return;
        }

        if (grabbedMesh === null) {
          grabbedMesh = experience.pointerSelection.getMeshUnderPointer(inputSource.uniqueId);
          if (grabbedMesh) {
            if (!originalPosition) {
              originalPosition = new Vector3(grabbedMesh.position.x, grabbedMesh.position.y, grabbedMesh.position.z);
            }
            grabbedMesh.position = controller.rootMesh.absolutePosition;
          }
        } else {
          grabbedMesh.position = controller.rootMesh.absolutePosition;
        }
      } else {
        if (grabbedMesh && originalPosition) {
          grabbedMesh.position = originalPosition;
          originalPosition = null;
          grabbedMesh = null;
        }
      }
    });
  }

  async createScene(): Promise<boolean> {
    this._scene = new Scene(this._engine);

    const lightPos = new Vector3(1, 1, 0);
    const light = new HemisphericLight('light1', lightPos, this._scene);
    light.name = 'light1'; // Mostly so that TypeScript doesn't complain.

    const cameraPos = new Vector3(0, 1.2, 0);
    const camera = new ArcRotateCamera('camera1', 0, 0, 3, cameraPos, this._scene, true);
    camera.position = new Vector3(0, 1.2, -1.1);
    camera.attachControl(this._canvas, true);
    camera.inputs.attached.mousewheel.detachControl();

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
    const header = new TextBlock();

    advancedTexture.addControl(panel);

    header.text = 'Text Block';
    header.height = '150px';
    header.width = '1400px';
    header.color = 'white';
    header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.fontSize = '60';
    panel.addControl(header);

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
        floorMeshes: this._floorMeshes
      });

      const shooterController = new OculusQuestShooterController(this._experience, this._scene, physicsRoot, header);
      this._controllers.push(shooterController);

      this._experience.input.onControllerAddedObservable.add((inputSource) => {
        inputSource.onMotionControllerInitObservable.add((controller) => {
          this.onMotionControllerInput(inputSource, controller);
        });
      });


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
