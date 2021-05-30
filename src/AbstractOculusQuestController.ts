import {
  AbstractMesh,
  Nullable,
  Ray,
  Vector3,
  WebXRAbstractMotionController,
  WebXRControllerComponent,
  WebXRDefaultExperience,
  WebXRInputSource
} from '@babylonjs/core';

/*
https://doc.babylonjs.com/typedoc/classes/babylon.webxroculustouchmotioncontroller
https://doc.babylonjs.com/typedoc/classes/babylon.webxrabstractmotioncontroller#getcomponentids
https://doc.babylonjs.com/typedoc/classes/babylon.webxrabstractmotioncontroller#loadmodel
https://doc.babylonjs.com/typedoc/classes/babylon.webxrabstractmotioncontroller#pulse
https://doc.babylonjs.com/typedoc/classes/babylon.webxrdomoverlay

*/

export default abstract class AbstractOculusQuestController {
  private _experience: WebXRDefaultExperience;
  protected _rightInputSource: WebXRInputSource;
  protected _leftInputSource: WebXRInputSource;
  private _rightController: WebXRAbstractMotionController;
  private _leftController: WebXRAbstractMotionController;
  private _anyTriggerPressed: boolean;
  private _rightTriggerPressed: boolean;
  private _leftTriggerPressed: boolean;

  constructor(experience: WebXRDefaultExperience) {
    this._experience = experience;

    this._anyTriggerPressed = false;
    this._rightTriggerPressed = false;
    this._leftTriggerPressed = false;

    // Hack.
    this._rightInputSource = null as unknown as WebXRInputSource;
    this._leftInputSource = null as unknown as WebXRInputSource;
    this._rightController = null as unknown as WebXRAbstractMotionController;
    this._leftController = null as unknown as WebXRAbstractMotionController;

    experience.input.onControllerAddedObservable.add((inputSource: WebXRInputSource) => {
      inputSource.onMotionControllerInitObservable.add((controller: WebXRAbstractMotionController) => {
        if (controller.handness === 'right') {
          this._rightInputSource = inputSource;
          this._rightController = controller;

          const aButtonComponent = controller.getComponent('a-button');
          aButtonComponent.onButtonStateChangedObservable.add((component) => {
            if (component.value > 0.8 && component.pressed) {
              this.onAButtonPressed(controller, component);
            }
          });

          const bButtonComponent = controller.getComponent('b-button');
          bButtonComponent.onButtonStateChangedObservable.add((component) => {
            if (component.value > 0.8 && component.pressed) {
              this.onBButtonPressed(controller, component);
            }
          });
        } else {
          this._leftInputSource = inputSource;
          this._leftController = controller;

          const xButtonComponent = controller.getComponent('x-button');
          xButtonComponent.onButtonStateChangedObservable.add((component) => {
            if (component.value > 0.8 && component.pressed) {
              this.onXButtonPressed(controller, component);
            }
          });
          const yButtonComponent = controller.getComponent('y-button');
          yButtonComponent.onButtonStateChangedObservable.add((component) => {
            if (component.value > 0.8 && component.pressed) {
              this.onYButtonPressed(controller, component);
            }
          });
        }

        const mainTriggerComponent = controller.getComponent('xr-standard-trigger');
        mainTriggerComponent.onButtonStateChangedObservable.add((component) => {
          if (component.value > 0.8 && component.pressed) {
            this._anyTriggerPressed = true;
            this.onAnyTriggered(controller, component);
            switch (controller.handness) {
              case 'right':
                this._rightTriggerPressed = true;
                this.onRightTriggered(controller, component);
                break;
              case 'left':
                this._leftTriggerPressed = true;
                this.onLeftTriggered(controller, component);
                break;
            }
          } else {
            if (this._anyTriggerPressed) {
              this._anyTriggerPressed = false;
            }
            if (this._rightTriggerPressed) {
              this._rightTriggerPressed = false;
            }
            if (this._leftTriggerPressed) {
              this._leftTriggerPressed = false;
            }
          }
        });

        const squeezeComponent = controller.getComponent('xr-standard-squeeze');
        squeezeComponent.onButtonStateChangedObservable.add((component) => {
          if (component.value > 0.8 && component.pressed) {
            this.onAnySqueezed(controller, component);
            if (controller.handness === 'right') {
              this.onRightSqueezed(controller, component);
            } else {
              this.onLeftSqueezed(controller, component);
            }
          }
        });

        const thumbStickComponent = controller.getComponent('xr-standard-thumbstick');
        thumbStickComponent.onButtonStateChangedObservable.add((component) => {
          if (component.value > 0.8 && component.pressed) {
            this.onAnyThumbStickPressed(controller, component);
            if (controller.handness === 'right') {
              this.onRightThumbStickPressed(controller, component);
            } else {
              this.onLeftThumbStickPressed(controller, component);
            }
          }
        });
      });
    });
  }

  /**
   * Handle when the 'A' button is pressed.
   * @param controller
   * @param component
   */
  abstract onAButtonPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the 'B' button is pressed.
   * @param controller
   * @param component
   */
  abstract onBButtonPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the 'X' button is pressed.
   * @param controller
   * @param component
   */
  abstract onXButtonPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;
  /**
   * Handle when the 'Y' button is pressed.
   * @param controller
   * @param component
   */
  abstract onYButtonPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when either the left or right trigger is pressed.
   * @param controller
   * @param component
   */
  abstract onAnyTriggered(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the right trigger is pressed.
   * @param controller
   * @param component
   */
  abstract onRightTriggered(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the left trigger is pressed.
   * @param controller
   * @param component
   */
  abstract onLeftTriggered(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when either the left or right trigger is released.
   * @param controller
   * @param component
   */
   abstract onAnyTriggerReleased(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

   /**
    * Handle when the right trigger is released.
    * @param controller
    * @param component
    */
   abstract onRightTriggerReleased(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

   /**
    * Handle when the left trigger is released.
    * @param controller
    * @param component
    */
   abstract onLeftTriggerReleased(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when either squeeze button is pressed.
   * @param controller
   * @param component
   */
  abstract onAnySqueezed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the right squeeze button is pressed.
   * @param controller
   * @param component
   */
  abstract onRightSqueezed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the left squeeze button is pressed.
   * @param controller
   * @param component
   */
  abstract onLeftSqueezed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the left or right thumbstick is pressed.
   * @param controller
   * @param component
   */
  abstract onAnyThumbStickPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Handle when the right thumbstick is pressed.
   * @param controller
   * @param component
   */
  abstract onRightThumbStickPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;
  /**
   * Handle when the left thumbstick is pressed.
   * @param controller
   * @param component
   */
  abstract onLeftThumbStickPressed(controller: WebXRAbstractMotionController, component: WebXRControllerComponent): void;

  /**
   * Get the absolute position of the specified controller
   * @param controller
   * @returns Vector3
   */
  getControllerPosition(controller: WebXRAbstractMotionController): Vector3 {
    if (!controller.rootMesh) {
      return new Vector3(0, 0, 0);
    }
    return controller.rootMesh?.absolutePosition;
  }

  /**
   * Get the absolute direction of the specified controller
   * @param controller
   * @returns Vector3
   */
  getControllerDirection(controller: WebXRAbstractMotionController): Vector3 {
    const ray: Ray = new Ray(new Vector3(), new Vector3());
    switch (controller.handness) {
      case 'right':
        this._rightInputSource?.getWorldPointerRayToRef(ray, true);
        break;
      case 'left':
        this._leftInputSource?.getWorldPointerRayToRef(ray, true);
        break;
    }
    return ray.direction;
  }

  /**
   * Get the object pointed to by the specified controller.
   * @param controller
   * @returns Mesh
   */
  getMeshUnderControllerPointer(controller: WebXRAbstractMotionController): Nullable<AbstractMesh> {
    switch (controller.handness) {
      case 'right':
        return this._experience.pointerSelection.getMeshUnderPointer(this._rightInputSource.uniqueId);
      case 'left':
      default:
        return this._experience.pointerSelection.getMeshUnderPointer(this._leftInputSource.uniqueId);
    }
  }

  /**
   * Get the absolute position of the right controller
   * @returns Vector3
   */
  getRightControllerPosition(): Vector3 {
    return this.getControllerPosition(this._rightController);
  }

  /**
   * Get the absolute direction of the right controller.
   * @returns Vector3
   */
  getRightControllerDirection(): Vector3 {
    return this.getControllerDirection(this._rightController);
  }

  /**
   * Get the object pointed to by the right controller.
   * @returns Mesh
   */
  getMeshUnderRightControllerPointer(): Nullable<AbstractMesh> {
    return this.getMeshUnderControllerPointer(this._rightController);
  }

  /**
   * Get the absolute position of the left controller.
   * @returns Vector3
   */
  getLeftControllerPosition(): Vector3 {
    return this.getControllerPosition(this._leftController);
  }

  /**
   * Get the absolute direction of the left controller.
   * @returns Vector3
   */
  getLeftControllerDirection(): Vector3 {
    return this.getControllerDirection(this._leftController);
  }

  /**
   * Get the object pointed to by the left controller.
   * @returns Mesh
   */
  getMeshUnderLeftContollerPointer(): Nullable<AbstractMesh> {
    return this.getMeshUnderControllerPointer(this._leftController);
  }
}
