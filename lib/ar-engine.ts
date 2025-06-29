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
  private isInitialized: boolean = false;
  private isDisposed: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    try {
      console.log('🏗️ Initializing AR Engine...');
      
      // Validate canvas
      if (!canvas || !canvas.getContext) {
        throw new Error('Invalid canvas provided to AR Engine');
      }

      // Initialize Three.js scene
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      
      // Initialize renderer with error handling
      try {
        this.renderer = new THREE.WebGLRenderer({ 
          canvas, 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        });
      } catch (error) {
        throw new Error(`Failed to initialize WebGL renderer: ${error}`);
      }
      
      this.loader = new GLTFLoader();
      this.objects = new Map();
      
      this.setupScene();
      this.setupCoordinateConverter();
      this.startRenderLoop();
      
      this.isInitialized = true;
      console.log('✅ AR Engine initialized successfully');
    } catch (error) {
      console.error('❌ AR Engine initialization failed:', error);
      this.dispose();
      throw error;
    }
  }

  private setupScene() {
    try {
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
      
      console.log('✅ AR scene setup complete');
    } catch (error) {
      console.error('❌ AR scene setup failed:', error);
      throw error;
    }
  }

  private setupCoordinateConverter() {
    this.coordinateConverter = {
      gpsToWorld: (lat: number, lng: number, alt: number = 0): Vector3 => {
        if (!this.userLocation) {
          console.warn('User location not set, using origin coordinates');
          return { x: 0, y: alt, z: 0 };
        }

        try {
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
        } catch (error) {
          console.error('Error in GPS to world conversion:', error);
          return { x: 0, y: alt, z: 0 };
        }
      },

      worldToGPS: (position: Vector3) => {
        if (!this.userLocation) {
          console.warn('User location not set for world to GPS conversion');
          return { lat: 0, lng: 0, alt: position.y };
        }

        try {
          const earthRadius = 6371000;
          const userLatRad = (this.userLocation.latitude * Math.PI) / 180;
          const userLngRad = (this.userLocation.longitude * Math.PI) / 180;

          const lat = this.userLocation.latitude + (position.z / earthRadius) * (180 / Math.PI);
          const lng = this.userLocation.longitude + (position.x / (earthRadius * Math.cos(userLatRad))) * (180 / Math.PI);
          const alt = position.y + (this.userLocation.altitude || 0);

          return { lat, lng, alt };
        } catch (error) {
          console.error('Error in world to GPS conversion:', error);
          return { lat: 0, lng: 0, alt: position.y };
        }
      }
    };
  }

  public setUserLocation(location: LocationData) {
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error('Invalid location data provided');
    }
    
    this.userLocation = location;
    console.log(`📍 User location set: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
  }

  public async loadObject(deployedObject: DeployedObject): Promise<void> {
    if (this.isDisposed) {
      throw new Error('AR Engine has been disposed');
    }

    if (!this.isInitialized) {
      throw new Error('AR Engine not properly initialized');
    }

    if (!deployedObject || !deployedObject.id) {
      throw new Error('Invalid deployed object provided');
    }

    try {
      console.log(`🔄 Loading AR object: ${deployedObject.name} (${deployedObject.id})`);

      // Convert GPS coordinates to world position
      const worldPosition = this.coordinateConverter.gpsToWorld(
        deployedObject.latitude,
        deployedObject.longitude,
        deployedObject.altitude || 0
      );

      let object: THREE.Object3D;

      try {
        // Try to load 3D model with timeout
        const modelUrl = deployedObject.model_url || this.getDefaultModelUrl(deployedObject.model_type);
        console.log(`📦 Loading model from: ${modelUrl}`);
        
        object = await this.loadModelWithTimeout(modelUrl, 10000);
        console.log(`✅ Model loaded successfully for ${deployedObject.name}`);
      } catch (modelError) {
        console.warn(`⚠️ Failed to load model for ${deployedObject.name}, using fallback:`, modelError);
        // Create fallback primitive object
        object = this.createFallbackObject(deployedObject);
      }

      // Validate object was created
      if (!object) {
        throw new Error('Failed to create AR object');
      }

      // Apply transformations with validation
      object.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
      object.rotation.set(
        ((deployedObject.rotation_x || 0) * Math.PI) / 180,
        ((deployedObject.rotation_y || 0) * Math.PI) / 180,
        ((deployedObject.rotation_z || 0) * Math.PI) / 180
      );
      object.scale.set(
        deployedObject.scale_x || 1.0,
        deployedObject.scale_y || 1.0,
        deployedObject.scale_z || 1.0
      );

      // Set object name for debugging
      object.name = `ar_object_${deployedObject.id}`;
      object.userData = { deployedObjectId: deployedObject.id };

      // Enable shadows and ensure proper setup
      this.setupObjectForRendering(object);

      // Add to scene and track
      this.scene.add(object);
      this.objects.set(deployedObject.id, object);

      console.log(`✅ AR object loaded: ${deployedObject.name} at position:`, worldPosition);
    } catch (error) {
      console.error(`❌ Failed to load AR object ${deployedObject.id}:`, error);
      throw new Error(`Failed to load AR object "${deployedObject.name}": ${error}`);
    }
  }

  private getDefaultModelUrl(modelType?: string): string {
    // Provide reliable fallback model URLs
    switch (modelType) {
      case 'cube':
      case 'box':
        return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf';
      case 'sphere':
        return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Sphere/glTF/Sphere.gltf';
      case 'duck':
        return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf';
      default:
        return 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf';
    }
  }

  private async loadModelWithTimeout(url: string, timeoutMs: number): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Model loading timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timeout);
          if (gltf && gltf.scene) {
            resolve(gltf.scene);
          } else {
            reject(new Error('Invalid GLTF model loaded'));
          }
        },
        (progress) => {
          console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
        },
        (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      );
    });
  }

  private createFallbackObject(deployedObject: DeployedObject): THREE.Object3D {
    try {
      // Create appropriate geometry based on model type
      let geometry: THREE.BufferGeometry;
      
      switch (deployedObject.model_type) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(0.5, 32, 32);
          break;
        case 'cube':
        case 'box':
          geometry = new THREE.BoxGeometry(1, 1, 1);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
          break;
        default:
          geometry = new THREE.SphereGeometry(0.5, 32, 32);
      }

      const material = new THREE.MeshLambertMaterial({ 
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.8
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // Ensure geometry has proper bounding volumes
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      
      console.log(`📦 Created fallback ${deployedObject.model_type || 'sphere'} for ${deployedObject.name}`);
      
      return mesh;
    } catch (error) {
      console.error('Error creating fallback object:', error);
      // Create the simplest possible fallback
      const geometry = new THREE.SphereGeometry(0.5, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      return new THREE.Mesh(geometry, material);
    }
  }

  private setupObjectForRendering(object: THREE.Object3D) {
    try {
      // Update world matrix to ensure proper transformations
      object.updateMatrixWorld(true);
      
      // Traverse and setup all child objects
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Ensure geometry has proper bounding volumes
          if (child.geometry) {
            if (!child.geometry.boundingSphere) {
              child.geometry.computeBoundingSphere();
            }
            if (!child.geometry.boundingBox) {
              child.geometry.computeBoundingBox();
            }
          }
        }
      });
    } catch (error) {
      console.error('Error setting up object for rendering:', error);
    }
  }

  public removeObject(objectId: string) {
    if (this.isDisposed) {
      console.warn('Cannot remove object: AR Engine has been disposed');
      return;
    }

    try {
      const object = this.objects.get(objectId);
      if (object) {
        this.scene.remove(object);
        this.objects.delete(objectId);
        
        // Clean up object resources
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(material => material.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        
        console.log(`🗑️ Removed AR object: ${objectId}`);
      }
    } catch (error) {
      console.error(`Error removing object ${objectId}:`, error);
    }
  }

  public clearAllObjects() {
    if (this.isDisposed) {
      console.warn('Cannot clear objects: AR Engine has been disposed');
      return;
    }

    try {
      this.objects.forEach((object, id) => {
        this.removeObject(id);
      });
      this.objects.clear();
      console.log('🧹 Cleared all AR objects');
    } catch (error) {
      console.error('Error clearing all objects:', error);
    }
  }

  public updateCameraOrientation(alpha: number, beta: number, gamma: number) {
    if (this.isDisposed) {
      return;
    }

    try {
      // Convert device orientation to camera rotation
      // This is a simplified implementation
      this.camera.rotation.set(
        (beta * Math.PI) / 180,
        (alpha * Math.PI) / 180,
        (gamma * Math.PI) / 180
      );
    } catch (error) {
      console.error('Error updating camera orientation:', error);
    }
  }

  public getObjectsInView(): string[] {
    if (this.isDisposed || !this.camera) {
      return [];
    }

    try {
      const frustum = new THREE.Frustum();
      const cameraMatrix = new THREE.Matrix4();
      cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(cameraMatrix);

      const visibleObjects: string[] = [];
      
      this.objects.forEach((object, id) => {
        try {
          // Ensure object world matrix is up to date
          object.updateMatrixWorld(true);
          
          // Compute bounding sphere for frustum culling
          const boundingSphere = this.computeObjectBoundingSphere(object);
          
          if (boundingSphere && frustum.intersectsSphere(boundingSphere)) {
            visibleObjects.push(id);
          }
        } catch (error) {
          console.warn(`Error checking visibility for object ${id}:`, error);
          // Include object in view if we can't determine visibility
          visibleObjects.push(id);
        }
      });

      return visibleObjects;
    } catch (error) {
      console.error('Error getting objects in view:', error);
      return [];
    }
  }

  private computeObjectBoundingSphere(object: THREE.Object3D): THREE.Sphere | null {
    try {
      // Create a bounding box for the entire object hierarchy
      const box = new THREE.Box3();
      box.setFromObject(object);
      
      // If box is empty, create a default sphere
      if (box.isEmpty()) {
        return new THREE.Sphere(object.position.clone(), 1.0);
      }
      
      // Create sphere from bounding box
      const sphere = new THREE.Sphere();
      box.getBoundingSphere(sphere);
      
      return sphere;
    } catch (error) {
      console.warn('Error computing bounding sphere:', error);
      // Return a default sphere at object position
      return new THREE.Sphere(object.position.clone(), 1.0);
    }
  }

  public getRenderStats() {
    if (this.isDisposed || !this.renderer) {
      return {
        fps: 0,
        triangles: 0,
        drawCalls: 0,
      };
    }

    try {
      return {
        fps: 0, // Would be calculated in real implementation
        triangles: this.renderer.info.render.triangles,
        drawCalls: this.renderer.info.render.calls,
      };
    } catch (error) {
      console.error('Error getting render stats:', error);
      return {
        fps: 0,
        triangles: 0,
        drawCalls: 0,
      };
    }
  }

  private startRenderLoop() {
    if (this.isDisposed) {
      return;
    }

    const animate = () => {
      if (this.isDisposed) {
        return;
      }

      this.animationId = requestAnimationFrame(animate);
      
      try {
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      } catch (error) {
        console.error('Error in render loop:', error);
      }
    };
    
    animate();
  }

  public resize(width: number, height: number) {
    if (this.isDisposed) {
      return;
    }

    try {
      if (this.camera && this.renderer) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    } catch (error) {
      console.error('Error resizing AR engine:', error);
    }
  }

  public dispose() {
    if (this.isDisposed) {
      return;
    }

    console.log('🧹 Disposing AR Engine...');
    this.isDisposed = true;

    try {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      this.clearAllObjects();
      
      if (this.renderer) {
        this.renderer.dispose();
      }
      
      this.isInitialized = false;
      console.log('✅ AR Engine disposed successfully');
    } catch (error) {
      console.error('Error disposing AR engine:', error);
    }
  }

  public isReady(): boolean {
    return this.isInitialized && !this.isDisposed && !!this.renderer && !!this.scene && !!this.camera;
  }
}