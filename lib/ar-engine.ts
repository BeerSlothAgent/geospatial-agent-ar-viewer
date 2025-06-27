import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ARObject, Vector3, ARScene, CoordinateConversion } from '@/types/ar';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';

export class AREngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private loader: GLTFLoader;
  private objects: Map<string, THREE.Object3D>;
  private userLocation: LocationData | null = null;
  private coordinateConverter: CoordinateConversion;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    this.loader = new GLTFLoader();
    this.objects = new Map();
    
    this.setupScene();
    this.setupCoordinateConverter();
    this.startRenderLoop();
  }

  private setupScene() {
    // Set renderer properties
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Setup camera
    this.camera.position.set(0, 1.6, 0); // Average human eye height
  }

  private setupCoordinateConverter() {
    this.coordinateConverter = {
      gpsToWorld: (lat: number, lng: number, alt: number = 0): Vector3 => {
        if (!this.userLocation) {
          return { x: 0, y: alt, z: 0 };
        }

        // Convert GPS coordinates to local world coordinates
        // Using simple Mercator projection for demo
        const earthRadius = 6371000; // meters
        const latRad = (lat * Math.PI) / 180;
        const lngRad = (lng * Math.PI) / 180;
        const userLatRad = (this.userLocation.latitude * Math.PI) / 180;
        const userLngRad = (this.userLocation.longitude * Math.PI) / 180;

        const x = earthRadius * (lngRad - userLngRad) * Math.cos(userLatRad);
        const z = -earthRadius * (latRad - userLatRad); // Negative Z for forward direction
        const y = alt - (this.userLocation.altitude || 0);

        return { x, y, z };
      },

      worldToGPS: (position: Vector3) => {
        if (!this.userLocation) {
          return { lat: 0, lng: 0, alt: position.y };
        }

        const earthRadius = 6371000;
        const userLatRad = (this.userLocation.latitude * Math.PI) / 180;
        const userLngRad = (this.userLocation.longitude * Math.PI) / 180;

        const lat = this.userLocation.latitude + (position.z / earthRadius) * (180 / Math.PI);
        const lng = this.userLocation.longitude + (position.x / (earthRadius * Math.cos(userLatRad))) * (180 / Math.PI);
        const alt = position.y + (this.userLocation.altitude || 0);

        return { lat, lng, alt };
      }
    };
  }

  public setUserLocation(location: LocationData) {
    this.userLocation = location;
  }

  public async loadObject(deployedObject: DeployedObject): Promise<void> {
    try {
      // Convert GPS coordinates to world position
      const worldPosition = this.coordinateConverter.gpsToWorld(
        deployedObject.latitude,
        deployedObject.longitude,
        deployedObject.altitude || 0
      );

      // Load 3D model
      const gltf = await this.loadModel(deployedObject.model_url);
      const object = gltf.scene;

      // Apply transformations
      object.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      object.rotation.set(
        (deployedObject.rotation_x * Math.PI) / 180,
        (deployedObject.rotation_y * Math.PI) / 180,
        (deployedObject.rotation_z * Math.PI) / 180
      );
      object.scale.set(
        deployedObject.scale_x,
        deployedObject.scale_y,
        deployedObject.scale_z
      );

      // Enable shadows
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add to scene and track
      this.scene.add(object);
      this.objects.set(deployedObject.id, object);

      console.log(`Loaded AR object: ${deployedObject.name} at position:`, worldPosition);
    } catch (error) {
      console.error(`Failed to load AR object ${deployedObject.id}:`, error);
      
      // Create fallback primitive object
      this.createFallbackObject(deployedObject);
    }
  }

  private async loadModel(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => reject(error)
      );
    });
  }

  private createFallbackObject(deployedObject: DeployedObject) {
    // Create a simple colored cube as fallback
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.8
    });
    const cube = new THREE.Mesh(geometry, material);

    const worldPosition = this.coordinateConverter.gpsToWorld(
      deployedObject.latitude,
      deployedObject.longitude,
      deployedObject.altitude || 0
    );

    cube.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
    cube.scale.set(
      deployedObject.scale_x,
      deployedObject.scale_y,
      deployedObject.scale_z
    );

    cube.castShadow = true;
    cube.receiveShadow = true;

    this.scene.add(cube);
    this.objects.set(deployedObject.id, cube);
  }

  public removeObject(objectId: string) {
    const object = this.objects.get(objectId);
    if (object) {
      this.scene.remove(object);
      this.objects.delete(objectId);
    }
  }

  public clearAllObjects() {
    this.objects.forEach((object) => {
      this.scene.remove(object);
    });
    this.objects.clear();
  }

  public updateCameraOrientation(alpha: number, beta: number, gamma: number) {
    // Convert device orientation to camera rotation
    // This is a simplified implementation
    this.camera.rotation.set(
      (beta * Math.PI) / 180,
      (alpha * Math.PI) / 180,
      (gamma * Math.PI) / 180
    );
  }

  public getObjectsInView(): string[] {
    const frustum = new THREE.Frustum();
    const cameraMatrix = new THREE.Matrix4();
    cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraMatrix);

    const visibleObjects: string[] = [];
    this.objects.forEach((object, id) => {
      if (frustum.intersectsObject(object)) {
        visibleObjects.push(id);
      }
    });

    return visibleObjects;
  }

  public getRenderStats() {
    return {
      fps: 0, // Would be calculated in real implementation
      triangles: this.renderer.info.render.triangles,
      drawCalls: this.renderer.info.render.calls,
    };
  }

  private startRenderLoop() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.clearAllObjects();
    this.renderer.dispose();
  }
}