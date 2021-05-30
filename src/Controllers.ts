import AbstractOculusQuestController from './AbstractOculusQuestController';

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

import {
  TextBlock,
} from '@babylonjs/gui';

/**
 * Shoot spheres using the Oculus Quest controller.
 */
export class OculusQuestShooterController extends AbstractOculusQuestController {
  private _scene: Scene;
  private _physicsRoot: Mesh;
  private _textBlock: TextBlock;

  constructor(helper: WebXRDefaultExperience, scene: Scene, physicsRoot: Mesh, textBlock: TextBlock) {
    super(helper);
    this._scene = scene;
    this._physicsRoot = physicsRoot;
    this._textBlock = textBlock;
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
    const forceDirection = new Vector3(direction.x, direction.y-0.5, direction.z);
    const forceMagnitude = 30;
    // Apply force to the sphere to fire
    sphere.physicsImpostor.applyImpulse(forceDirection.scale(forceMagnitude), sphere.getAbsolutePosition());
  }

  onAButtonPressed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "A Button Pressed";
    this.shoot(controller);
  }

  onBButtonPressed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "B Button Pressed";
    this.shoot(controller);
  }

  onXButtonPressed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "X Button Pressed";
    this.shoot(controller);
  }

  onYButtonPressed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Y Button Pressed";
    this.shoot(controller);
  }

  onAnyTriggered(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this.shoot(controller);
  }

  onRightTriggered(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Right triggered";
  }

  onLeftTriggered(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Left triggered";
  }

  onAnyTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onLeftTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onRightTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}

  onAnySqueezed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    //this.shoot(controller);
  }

  onRightSqueezed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Right squeezed";
  }

  onLeftSqueezed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Left squeezed";
    this.shoot(controller);
  }

  onAnyThumbStickPressed(controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this.shoot(controller);
  }

  onRightThumbStickPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Right Thumb Stick Pressed";
  }

  onLeftThumbStickPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    this._textBlock.text = "Left Thumb Stick Pressed";
  }
}

/**
 * Handle grabs with the right controller.
 */
export class OculusQuestGrabController extends AbstractOculusQuestController {
  private _grabbedMesh: Nullable<AbstractMesh> = null;
  private _originalPosition: Nullable<Vector3> = null;
  private _helper: WebXRDefaultExperience;

  constructor(helper: WebXRDefaultExperience) {
    super(helper);
    this._helper = helper;
  }

  onAButtonPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onBButtonPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onXButtonPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onYButtonPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onAnyTriggered(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}

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

  onLeftTriggered(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onAnyTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onLeftTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}

  onRightTriggerReleased(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {
    if (this._grabbedMesh && this._originalPosition) {
      this._grabbedMesh.position = this._originalPosition;
      this._originalPosition = null;
      this._grabbedMesh = null;
    }
  }

  onAnySqueezed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onRightSqueezed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onLeftSqueezed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onAnyThumbStickPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onRightThumbStickPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
  onLeftThumbStickPressed(_controller: WebXRAbstractMotionController, _component: WebXRControllerComponent) {}
}
