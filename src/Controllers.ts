import {
  AbstractMesh,
  //Axis,
  Color3,
  GlowLayer,
  Mesh,
  MeshBuilder,
  Nullable,
  PBRMaterial,
  PhysicsImpostor,
  Quaternion,
  Scene,
  SceneLoader,
  //Space,
  TransformNode,
  Vector3,
  WebXRAbstractMotionController,
  WebXRControllerComponent,
  WebXRDefaultExperience,
} from '@babylonjs/core';

import { BaseController } from './AbstractController';

function createMallet(scene: Scene) {
  const handle = MeshBuilder.CreateCylinder("handle", {height: 0.5, diameter: 0.04}, scene);
  handle.position.y = 0.05;
  const head = MeshBuilder.CreateCylinder("head", {height: 0.2, diameter: 0.1}, scene);
  head.rotate(head.right, Math.PI / 2);
  head.position.y = 0.3
  const mallet = new TransformNode("mallet", scene);
  handle.parent = mallet;
  head.parent = mallet;

  const handleMat = new PBRMaterial("handleMat", scene);
  handleMat.albedoColor = new Color3(0.6, 0.5, 0.2);
  handleMat.roughness = 0.3;
  handle.material = handleMat;

  const headMat = new PBRMaterial("headMat", scene);
  headMat.albedoColor = Color3.BlackReadOnly;
  headMat.roughness = 0.6;
  head.material = headMat;

  return mallet;
}


/**
 * Shoot spheres using the Oculus Quest controller.
 */
export class ShooterController extends BaseController {
  private _scene: Scene;
  private _physicsRoot: Mesh;

  constructor(xr: WebXRDefaultExperience, scene: Scene, physicsRoot: Mesh) {
    super(xr);
    this._scene = scene;
    this._physicsRoot = physicsRoot;
  }

  async setupLightsaber(xr: WebXRDefaultExperience, scene: Scene) {
    // Using the glTF model imported from: https://www.remix3d.com/details/G009SWQ4DT9P
    // Thanks to Paint3D
    const model = await SceneLoader.ImportMeshAsync('', '//david.blob.core.windows.net/babylonjs/', 'lasersaber.glb', scene);

    const mallet = createMallet(scene);

    const meshChildren = model.meshes[0].getChildMeshes();
    for (let i = 0; i < meshChildren.length; i++) {
      // looking for the laser itself to scale it a little bit
      if (meshChildren[i].id === 'mesh_id37') {
        meshChildren[i].scaling.y *= 2.2;
        //meshChildren[i].position.y += 120;
        (meshChildren[i].material as any).emissiveColor = Color3.White();
        break;
      }
    }

    const lightsaber = model.meshes[0];
    //lightsaber.position = new Vector3(0, 1, 2);
    lightsaber.isVisible = false;

    const gl = new GlowLayer('glow', scene, {
      mainTextureFixedSize: 512
    });
    gl.isEnabled = true;

    xr.pointerSelection.detach();

    xr.input.onControllerAddedObservable.add((source) => {
      if (source.inputSource.handedness === 'right') {
        lightsaber.parent = source.grip || source.pointer;
        lightsaber.isVisible = true;
        lightsaber.position = Vector3.Zero();
        //lightsaber.rotation = mesh.rotation;
        //lightsaber.rotate(Axis.X, Math.PI / 2);
        lightsaber.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
        //lightsaber.position.z += 0.2;
        //lightsaber.rotate(Axis.X, 1.57079, Space.LOCAL);
        //lightsaber.rotate(Axis.Y, 3.14159, Space.LOCAL);
        //lightsaber.locallyTranslate(new Vector3(0, -0.1, 0));
      } else {
        mallet.setParent((source as any).grip);
        mallet.position = Vector3.Zero();
        mallet.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
      }
      /*
      source.onMotionControllerInitObservable.add((motionController) => {
        motionController.onModelLoadedObservable.add(() => {
          // motionController.rootMesh = lightsaber;

          //let mesh = <AbstractMesh>source.grip;
          if (motionController.handedness === 'right') {
            lightsaber.parent = source.grip || source.pointer;
            lightsaber.isVisible = true;
            lightsaber.position = Vector3.Zero();
            //lightsaber.rotation = mesh.rotation;
            //lightsaber.rotate(Axis.X, Math.PI / 2);
            lightsaber.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
            //lightsaber.position.z += 0.2;
            //lightsaber.rotate(Axis.X, 1.57079, Space.LOCAL);
            //lightsaber.rotate(Axis.Y, 3.14159, Space.LOCAL);
            //lightsaber.locallyTranslate(new Vector3(0, -0.1, 0));
          } else {
            mallet.setParent((source as any).grip);
            mallet.position = Vector3.Zero();
            mallet.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, 0, 0);
          }
        });
      });
      */
    });
  }

  shoot(controller: WebXRAbstractMotionController) {
    const id = new Date().getTime();
    const sphere = MeshBuilder.CreateSphere(`sphere${id}`, { diameter: 0.1 }, this._scene);
    // Make the position of the sphere the same as the controller
    sphere.position = this.getControllerPosition(controller);
    // Specify to perform physics
    sphere.physicsImpostor = new PhysicsImpostor(sphere, PhysicsImpostor.SphereImpostor, { mass: 5 }, this._scene);
    this._physicsRoot.addChild(sphere);
    // Get the controller of the direction we want to launch in the same direction with the controller.
    const direction = this.getControllerDirection(controller);
    // For some reason it is slightly upward, so fine-tune it
    const forceDirection = new Vector3(direction.x, direction.y - 0.5, direction.z);
    const forceMagnitude = 50;
    // Apply force to the sphere to fire
    sphere.physicsImpostor.applyImpulse(forceDirection.scale(forceMagnitude), sphere.getAbsolutePosition());
  }

  onLeftTriggered(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this.shoot(controller);
  }
}

/**
 * Handle grabs with the right controller.
 */
export class GrabController extends BaseController {
  private _grabbedMesh: Nullable<AbstractMesh> = null;
  private _originalPosition: Nullable<Vector3> = null;
  private _helper: WebXRDefaultExperience;

  constructor(helper: WebXRDefaultExperience) {
    super(helper);
    this._helper = helper;
  }

  onRightTriggered(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    if (!controller.rootMesh) {
      return;
    }
    if (!this._grabbedMesh) {
      this._grabbedMesh = this._helper.pointerSelection.getMeshUnderPointer(this._rightInputSource.uniqueId);
      if (this._grabbedMesh) {
        if (!this._originalPosition) {
          const { position } = this._grabbedMesh;
          this._originalPosition = new Vector3(position.x, position.y, position.z);
        }
        this._grabbedMesh.position = controller.rootMesh.absolutePosition;
      }
    } else {
      this._grabbedMesh.position = controller.rootMesh.absolutePosition;
    }
  }

  onRightTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    if (this._grabbedMesh && this._originalPosition) {
      this._grabbedMesh.position = this._originalPosition;
      this._originalPosition = null;
      this._grabbedMesh = null;
    }
  }
}
