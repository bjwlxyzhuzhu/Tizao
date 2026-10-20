import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

function Link({
  from,
  to,
  color
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const direction = end.clone().sub(start);
  const length = Math.max(0.01, direction.length());
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );

  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}>
      <cylinderGeometry args={[0.025, 0.025, length, 10]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

interface Props {
  benchHeightMm: number;
  targetXMm: number;
  shoulderHeightMm: number;
  armLengthMm: number;
}

export function WorkstationScene({ benchHeightMm, targetXMm, shoulderHeightMm, armLengthMm }: Props) {
  const benchY = benchHeightMm / 1000;
  const targetX = targetXMm / 1000;
  const shoulderY = shoulderHeightMm / 1000;
  const armLength = armLengthMm / 1000;

  const shoulder: [number, number, number] = [0.12, shoulderY, 0];
  const target: [number, number, number] = [targetX, benchY + 0.06, 0];
  const distance = Math.sqrt(
    Math.pow(target[0] - shoulder[0], 2) + Math.pow(target[1] - shoulder[1], 2)
  );
  const reachable = distance <= armLength;
  const linkColor = reachable ? '#43d6c5' : '#ff6b6b';

  const bodyTop = shoulderY;
  const bodyBottom = 0.25;
  const bodyHeight = Math.max(0.3, bodyTop - bodyBottom);

  return (
    <div className="scene-wrap">
      <Canvas camera={{ position: [2.4, 1.7, 2.6], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#050a12']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />

        <mesh position={[0, bodyBottom + bodyHeight / 2, 0]}>
          <capsuleGeometry args={[0.16, bodyHeight, 8, 16]} />
          <meshStandardMaterial color="#5b9dff" metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, shoulderY + 0.2, 0]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#c9d2de" metalness={0.2} roughness={0.5} />
        </mesh>
        <mesh position={[-0.09, 0.12, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 12]} />
          <meshStandardMaterial color="#3b4b63" />
        </mesh>
        <mesh position={[0.09, 0.12, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 12]} />
          <meshStandardMaterial color="#3b4b63" />
        </mesh>

        <mesh position={[targetX / 2 + 0.2, benchY - 0.03, 0]}>
          <boxGeometry args={[Math.max(0.5, targetX + 0.3), 0.06, 0.6]} />
          <meshStandardMaterial color="#394b66" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[targetX / 2 + 0.2, benchY / 2, 0]}>
          <boxGeometry args={[0.08, benchY, 0.08]} />
          <meshStandardMaterial color="#26364d" metalness={0.6} roughness={0.4} />
        </mesh>

        <mesh position={target}>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshStandardMaterial color={linkColor} emissive={linkColor} emissiveIntensity={0.6} />
        </mesh>

        <Link from={shoulder} to={target} color={linkColor} />

        <gridHelper args={[8, 16, '#16243a', '#0d1626']} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={7} target={[0.35, 1.05, 0]} />
      </Canvas>
    </div>
  );
}
