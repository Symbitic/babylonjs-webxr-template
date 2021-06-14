import {
  AbstractMesh,
  Mesh,
  MeshBuilder,
  Nullable,
  PhysicsImpostor,
  Scene,
  Vector3,
  WebXRAbstractMotionController,
  WebXRControllerComponent,
  WebXRDefaultExperience,
} from '@babylonjs/core';

import { BaseController } from './AbstractController';

/**
 * Shoot spheres using the Oculus Quest controller.
 */
export class ShooterController extends BaseController {
  private _scene: Scene;
  private _physicsRoot: Mesh;

  constructor(helper: WebXRDefaultExperience, scene: Scene, physicsRoot: Mesh) {
    super(helper);
    this._scene = scene;
    this._physicsRoot = physicsRoot;
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
