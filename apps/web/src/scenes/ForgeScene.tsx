import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Press({ speed, temperatureC }: { speed: number; temperatureC: number }) {
  const ram = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ram.current) return;
    const t = state.clock.getElapsedTime();
    ram.current.position.y = 1.45 + Math.sin(t * (0.5 + speed * 0.12)) * 0.12;
  });

  const heat = Math.max(0, Math.min(1, (temperatureC - 700) / 350));

  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.7, 0.16, 1.2]} />
        <meshStandardMaterial color="#1b2738" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[-0.7, 1, 0]}>
        <boxGeometry args={[0.16, 2, 0.3]} />
        <meshStandardMaterial color="#2b3b53" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 1, 0]}>
        <boxGeometry args={[0.16, 2, 0.3]} />
        <meshStandardMaterial color="#2b3b53" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.08, 0]}>
        <boxGeometry args={[1.7, 0.2, 0.3]} />
        <meshStandardMaterial color="#2b3b53" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={ram} position={[0, 1.45, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.5]} />
        <meshStandardMaterial color="#8fa2ba" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.35, 0.5]} />
        <meshStandardMaterial
          color="#c9d2de"
          metalness={0.7}
          roughness={0.35}
          emissive="#ff6a00"
          emissiveIntensity={heat * 0.9}
        />
      </mesh>
    </group>
  );
}

export function ForgeScene({ pressSpeed, temperatureC }: { pressSpeed: number; temperatureC: number }) {
  return (
    <div className="scene-wrap">
      <Canvas camera={{ position: [2.8, 2.2, 3.2], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#050a12']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} />
        <pointLight position={[0, 0.8, 0]} intensity={1.4} color="#ff6a00" distance={6} />
        <Press speed={pressSpeed} temperatureC={temperatureC} />
        <gridHelper args={[8, 16, '#16243a', '#0d1626']} />
        <OrbitControls enablePan={false} minDistance={2.2} maxDistance={8} target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}

void THREE;
