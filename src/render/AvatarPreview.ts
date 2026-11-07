import * as THREE from 'three';
import type { Avatar } from '../core/profile/profile';
import type { Equipped } from '../core/rewards/rewards';
import { buildAnimal } from './avatars/animals';
import { tickAnimals } from './avatars/animation';
import { disposeObject } from './toon';

/** Small turntable rendering of an avatar (used in the profile creation screen). */
export class AvatarPreview {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  private readonly resizeObserver: ResizeObserver;
  private model: THREE.Group | null = null;
  private readonly clock = new THREE.Clock();

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.style.display = 'block';
    container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#88aa77', 1.8));
    const sun = new THREE.DirectionalLight('#ffffff', 2);
    sun.position.set(2, 4, 3);
    this.scene.add(sun);
    this.camera.position.set(0, 0.9, 3.6);
    this.camera.lookAt(0, 0.55, 0);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    let last = 0;
    this.renderer.setAnimationLoop(() => {
      const t = this.clock.getElapsedTime();
      if (this.model) {
        this.model.rotation.y = Math.sin(t * 0.9) * 0.7;
        this.model.position.y = Math.abs(Math.sin(t * 3)) * 0.05;
      }
      tickAnimals(this.scene, Math.min(t - last, 0.1));
      last = t;
      this.renderer.render(this.scene, this.camera);
    });
  }

  setAvatar(avatar: Avatar, equipped: Equipped = {}): void {
    if (this.model) {
      this.scene.remove(this.model);
      disposeObject(this.model);
    }
    this.model = buildAnimal(avatar, equipped);
    this.scene.add(this.model);
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    disposeObject(this.scene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
