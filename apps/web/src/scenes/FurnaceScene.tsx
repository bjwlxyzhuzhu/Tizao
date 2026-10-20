import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Furnace({ poolDepthMm, meltRate }: { poolDepthMm: number; meltRate: number }) {
  const electrode = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (electrode.current) electrode.current.rotation.y += delta * (0.15 + meltRate * 0.02);
  });

  const poolHeight = Math.max(0.02, Math.min(0.7, poolDepthMm / 300));
  const glow = Math.min(2.2, 0.6 + meltRate * 0.07);

  return (
    <group>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 2, 40, 1, true]} />
        <meshStandardMaterial
          color="#26364d"
          metalness={0.85}
          roughness={0.35}
          side={THREE.DoubleSide}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.1, 40]} />
        <meshStandardMaterial color="#16202f" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.9, 36]} />
        <meshStandardMaterial color="#394b66" metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1 + poolHeight / 2, 0]}>
        <cylinderGeometry args={[0.4, 0.4, poolHeight, 36]} />
        <meshStandardMaterial color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={glow} />
      </mesh>
      <mesh ref={electrode} position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.7, 24]} />
        <meshStandardMaterial color="#a9b7c9" metalness={0.95} roughness={0.18} />
      </mesh>
    </group>
  );
}

export function FurnaceScene({ meltRate, poolDepthMm }: { meltRate: number; poolDepthMm: number }) {
  return (
    <div className="scene-wrap">
      <Canvas camera={{ position: [2.6, 2.5, 3.4], fov: 42 }} dpr={[1, 2]}>
        <color attach="background" args={['#050a12']} />
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#8fb6ff', '#0a1220', 0.7]} />
        <directionalLight position={[4, 6, 3]} intensity={1.4} />
        <pointLight position={[0, 1.1, 0]} intensity={2.2} color="#ff7a1a" distance={7} />
        <Furnace poolDepthMm={poolDepthMm} meltRate={meltRate} />
        <gridHelper args={[8, 16, '#16243a', '#0d1626']} />
        <OrbitControls enablePan={false} minDistance={2.2} maxDistance={8} target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
