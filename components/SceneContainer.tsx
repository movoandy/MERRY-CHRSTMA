import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { AppState, HandGesture, ParticleData } from '../types';

interface SceneContainerProps {
  appState: AppState;
  photos: THREE.Texture[];
  gesture: HandGesture;
  onPhotoSelect: () => void;
  onBackgroundClick: () => void;
}

const SceneContainer: React.FC<SceneContainerProps> = ({ 
  appState, 
  photos, 
  gesture, 
  onPhotoSelect,
  onBackgroundClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  
  // Refs for animation loop data
  const particlesRef = useRef<ParticleData[]>([]);
  const dummyRef = useRef(new THREE.Object3D());
  const meshesRef = useRef<{
    spheres: THREE.InstancedMesh;
    cubes: THREE.InstancedMesh;
  } | null>(null);
  const photoMeshesRef = useRef<THREE.Mesh[]>([]);
  const groupRef = useRef<THREE.Group | null>(null);
  const timeRef = useRef(0);
  const stateLerpRef = useRef(0); // 0 = Tree, 1 = Scatter
  const activePhotoIndexRef = useRef<number>(-1);
  const gestureRef = useRef(gesture);

  // Keep gesture ref up to date for the animation loop
  useEffect(() => {
    gestureRef.current = gesture;
  }, [gesture]);

  // Reset active photo when leaving Zoom state
  useEffect(() => {
    if (appState !== AppState.PHOTO_ZOOM) {
      activePhotoIndexRef.current = -1;
    }
  }, [appState]);

  // Colors
  const COLORS = useMemo(() => [
    new THREE.Color('#D4AF37'), // Metallic Gold
    new THREE.Color('#C41E3A'), // Christmas Red
    new THREE.Color('#2F4F4F'), // Matte Green (Dark Slate)
    new THREE.Color('#E5E4E2'), // Platinum/Silver
  ], []);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 18);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5, 0.4, 0.85
    );
    bloomPass.strength = 1.0; 
    bloomPass.radius = 0.8;
    bloomPass.threshold = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffd700, 2, 50);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    const spotLight = new THREE.SpotLight(0xff0000, 5, 50, 0.5, 0.5);
    spotLight.position.set(10, 20, 10);
    scene.add(spotLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(-5, 10, 7);
    scene.add(dirLight);

    // Group for rotation
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    // --- Create Particles (Ornaments) ---
    const particleCount = 2000;
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const cubeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);

    const materialBase = new THREE.MeshStandardMaterial({
      roughness: 0.3,
      metalness: 0.9,
    });

    const sphereMesh = new THREE.InstancedMesh(sphereGeo, materialBase, particleCount);
    const cubeMesh = new THREE.InstancedMesh(cubeGeo, materialBase, particleCount);

    sphereMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cubeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    group.add(sphereMesh);
    group.add(cubeMesh);

    meshesRef.current = { spheres: sphereMesh, cubes: cubeMesh };

    // Generate Particle Data
    const particles: ParticleData[] = [];
    const treeHeight = 20;
    const treeRadiusBase = 8;

    for (let i = 0; i < particleCount * 2; i++) {
      const isCube = i >= particleCount;
      const meshIndex = isCube ? i - particleCount : i;
      
      // Tree Formation (Cone)
      const t = i / (particleCount * 2); 
      // Distribute points in a cone volume, biased towards surface
      const h = (Math.random()) * treeHeight - (treeHeight / 2); // Height
      const heightPercent = (h + treeHeight/2) / treeHeight; 
      const radiusAtHeight = (1 - heightPercent) * treeRadiusBase;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radiusAtHeight; // Uniform distribution in circle

      const treeX = Math.cos(angle) * r;
      const treeZ = Math.sin(angle) * r;
      const treePos = new THREE.Vector3(treeX, h, treeZ);

      // Scatter Formation (Random Cloud)
      const scatterPos = new THREE.Vector3(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20
      );

      // Color assignment
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const tempMat = isCube ? cubeMesh : sphereMesh;
      tempMat.setColorAt(meshIndex, color);

      particles.push({
        id: i,
        initialPos: treePos.clone(),
        targetPos: treePos,
        scatterPos: scatterPos,
        velocity: new THREE.Vector3(),
        meshIndex,
        type: isCube ? 'cube' : 'sphere'
      });
    }

    // Update instance colors
    sphereMesh.instanceColor!.needsUpdate = true;
    cubeMesh.instanceColor!.needsUpdate = true;
    particlesRef.current = particles;

    // Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      composerRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      timeRef.current += 0.01;
      
      if (updateLogicRef.current) updateLogicRef.current();

      if (composerRef.current) composerRef.current.render();
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [COLORS]);

  // --- Handle Photo Updates ---
  useEffect(() => {
    if (!groupRef.current || !photos.length) return;

    // Clean up old photos
    photoMeshesRef.current.forEach(m => groupRef.current?.remove(m));
    photoMeshesRef.current = [];

    // Create new photo meshes
    photos.forEach((tex, i) => {
        const aspect = tex.image.width / tex.image.height;
        const width = 2;
        const height = width / aspect;
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({ 
            map: tex, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9 
        });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Random scatter position
        mesh.userData = {
            id: i,
            scatterPos: new THREE.Vector3(
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 15
            ),
            treePos: new THREE.Vector3( 
                Math.sin(i * 137.5) * (3 + i*0.2), // phyllotaxis spiralish
                (i / photos.length) * 12 - 6,
                Math.cos(i * 137.5) * (3 + i*0.2)
            ),
            rotationSpeed: (Math.random() - 0.5) * 0.02
        };

        // Start at tree pos
        mesh.position.copy(mesh.userData.treePos);
        groupRef.current?.add(mesh);
        photoMeshesRef.current.push(mesh);
    });

  }, [photos]);

  // Ref to hold the update logic
  const updateLogicRef = useRef<() => void>(() => {});

  // --- Animation Frame Logic ---
  useEffect(() => {
    updateLogicRef.current = () => {
      if (!groupRef.current || !meshesRef.current || !cameraRef.current) return;
      
      const currentGesture = gestureRef.current;
      const targetLerp = appState === AppState.TREE ? 0 : 1;
      
      // Smoothly interpolate current state factor
      stateLerpRef.current += (targetLerp - stateLerpRef.current) * 0.05;
      
      // Auto-select random photo if none selected but zooming
      if (appState === AppState.PHOTO_ZOOM && activePhotoIndexRef.current === -1 && photoMeshesRef.current.length > 0) {
         activePhotoIndexRef.current = Math.floor(Math.random() * photoMeshesRef.current.length);
      }

      const isScattered = stateLerpRef.current > 0.5;
      const dummy = dummyRef.current;
      const time = timeRef.current;

      // 1. Update Particles
      particlesRef.current.forEach((p) => {
        const x = THREE.MathUtils.lerp(p.targetPos.x, p.scatterPos.x, stateLerpRef.current);
        const y = THREE.MathUtils.lerp(p.targetPos.y, p.scatterPos.y, stateLerpRef.current);
        const z = THREE.MathUtils.lerp(p.targetPos.z, p.scatterPos.z, stateLerpRef.current);
        
        // Hover/Float Effect
        const floatFactor = stateLerpRef.current; 
        const noiseX = Math.sin(time + p.id * 0.1) * 0.5 * floatFactor;
        const noiseY = Math.cos(time + p.id * 0.1) * 0.5 * floatFactor;

        dummy.position.set(x + noiseX, y + noiseY, z);
        dummy.rotation.set(time * 0.5 + p.id, time * 0.3 + p.id, 0);
        
        const scale = isScattered ? 0.6 : 1.0;
        dummy.scale.setScalar(scale); 
        dummy.updateMatrix();

        if (p.type === 'sphere') {
          meshesRef.current!.spheres.setMatrixAt(p.meshIndex, dummy.matrix);
        } else {
          meshesRef.current!.cubes.setMatrixAt(p.meshIndex, dummy.matrix);
        }
      });

      meshesRef.current.spheres.instanceMatrix.needsUpdate = true;
      meshesRef.current.cubes.instanceMatrix.needsUpdate = true;
      
      // 2. Update Photos
      photoMeshesRef.current.forEach((mesh, index) => {
        const { scatterPos, treePos, rotationSpeed } = mesh.userData;
        const isZoomed = index === activePhotoIndexRef.current;

        let targetX, targetY, targetZ;

        if (isZoomed) {
             // Calculate position exactly in front of camera
             // We need to account for the Group's rotation by converting world target to local space
             const worldTarget = new THREE.Vector3(0, 2, 14); // 4 units in front of camera (z=18)
             const localTarget = worldTarget.clone();
             groupRef.current!.worldToLocal(localTarget);
             
             targetX = localTarget.x;
             targetY = localTarget.y;
             targetZ = localTarget.z;

             // Look at camera (Mesh lookAt works in world space usually, but we need to be careful inside rotated group)
             // Actually mesh.lookAt(camera.position) works correctly in Three.js even inside rotated parents
             mesh.lookAt(cameraRef.current!.position);
             
             // Scale up significantly
             mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, 3.5, 0.1));
        } else {
            // Normal behavior
            targetX = THREE.MathUtils.lerp(treePos.x, scatterPos.x, stateLerpRef.current);
            targetY = THREE.MathUtils.lerp(treePos.y, scatterPos.y, stateLerpRef.current);
            targetZ = THREE.MathUtils.lerp(treePos.z, scatterPos.z, stateLerpRef.current);
            mesh.rotation.y += rotationSpeed;
            mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, 1, 0.1));
        }

        // Apply position
        mesh.position.x += (targetX - mesh.position.x) * 0.1;
        mesh.position.y += (targetY - mesh.position.y) * 0.1;
        mesh.position.z += (targetZ - mesh.position.z) * 0.1;
      });

      // 3. Global Rotation
      if (appState === AppState.TREE) {
         groupRef.current.rotation.y += 0.002;
         groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
      } else if (appState === AppState.SCATTER) {
         // SCATTER MODE: Hand Controls Rotation
         const targetRotY = (currentGesture.palmPosition.x - 0.5) * 4; 
         const targetRotX = (currentGesture.palmPosition.y - 0.5) * 2;
         
         groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.05;
         groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
      }
      // Note: In PHOTO_ZOOM, we stop updating rotation so user can focus
    };
  }, [appState]);

  // --- Interaction Handler (Click/Hover) ---
  const handleInteraction = useCallback((event: React.MouseEvent) => {
      if (!rendererRef.current || !cameraRef.current) return;
      
      // Calculate mouse position
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const mouse = new THREE.Vector2(x, y);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(photoMeshesRef.current);
      
      if (intersects.length > 0) {
          const selectedMesh = intersects[0].object as THREE.Mesh;
          const index = photoMeshesRef.current.indexOf(selectedMesh);
          if (index !== -1) {
              activePhotoIndexRef.current = index;
              onPhotoSelect();
          }
      } else {
          // Clicked empty space
          if (appState === AppState.PHOTO_ZOOM) {
              onBackgroundClick();
          }
      }
  }, [onPhotoSelect, onBackgroundClick, appState]);

  // Hover Effect (Cursor)
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current) return;
    
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const mouse = new THREE.Vector2(x, y);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(photoMeshesRef.current);
    
    document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  }, []);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full" 
        onClick={handleInteraction}
        onMouseMove={handleMouseMove}
    />
  );
};

export default SceneContainer;