import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, Environment, Cloud, Float, Instance, Instances } from '@react-three/drei';
import * as THREE from 'three';
import { HydroDataPoint, STATION_COLORS } from '../types';

// --- Constants ---
const RIVER_LENGTH = 160;
const RIVER_WIDTH_BASE = 8;
const SEGMENTS = 200;

interface SimulationProps {
    data: HydroDataPoint[];
    currentTime: number;
    isPlaying: boolean;
    onTogglePlay: () => void;
}

// --- Helpers ---

const CameraController = ({ targetX }: { targetX: number }) => {
    const { camera, controls } = useThree();

    useFrame(() => {
        if (controls) {
            // @ts-ignore
            const currentTarget = controls.target;
            const lerpFactor = 0.1;
            const diffX = targetX - currentTarget.x;

            if (Math.abs(diffX) > 0.01) {
                currentTarget.x += diffX * lerpFactor;
                camera.position.x += diffX * lerpFactor;
                // @ts-ignore
                controls.update();
            }
        }
    });
    return null;
};

// --- Asset Components (Houses, Trees) ---

const SimpleTree = ({ position, scale = 1 }: { position: [number, number, number], scale?: number }) => {
    return (
        <group position={position} scale={[scale, scale, scale]}>
            {/* Tronc */}
            <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
                <meshStandardMaterial color="#78350f" roughness={1} />
            </mesh>
            {/* Feuillage */}
            <mesh position={[0, 3, 0]} castShadow>
                <coneGeometry args={[1.5, 4, 8]} />
                <meshStandardMaterial color="#15803d" roughness={0.8} />
            </mesh>
            <mesh position={[0, 4.5, 0]} castShadow>
                <coneGeometry args={[1.2, 3, 8]} />
                <meshStandardMaterial color="#166534" roughness={0.8} />
            </mesh>
        </group>
    );
};

const SimpleHouse = ({ position, rotationY = 0, color = "#f1f5f9" }: { position: [number, number, number], rotationY?: number, color?: string }) => {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Corps de la maison */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 3, 3]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Toit */}
            <mesh position={[0, 3.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[2.8, 1.5, 4]} />
                <meshStandardMaterial color="#be123c" /> {/* Toit rouge tuile */}
            </mesh>
            {/* Porte */}
            <mesh position={[0, 1, 1.51]}>
                <planeGeometry args={[0.8, 1.8]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
};

const CityGroup = ({ position, count, spread = 10 }: { position: [number, number, number], count: number, spread?: number }) => {
    const houses = useMemo(() => {
        return new Array(count).fill(0).map((_, i) => {
            const xOff = (Math.random() - 0.5) * spread;
            const zOff = (Math.random() - 0.5) * (spread / 2); // Moins de profondeur pour rester sur la berge
            return {
                pos: [xOff, 0, zOff] as [number, number, number],
                rot: (Math.random() - 0.5) * 0.5,
                color: Math.random() > 0.5 ? "#f1f5f9" : "#e2e8f0"
            };
        });
    }, [count, spread]);

    return (
        <group position={position}>
            {houses.map((h, i) => (
                <SimpleHouse key={i} position={h.pos} rotationY={h.rot} color={h.color} />
            ))}
        </group>
    );
};

// --- Infiltration Visuals ---

const StaticArrow = ({ color = "#0ea5e9" }: { color?: string }) => {
    return (
        <group scale={[1.2, 1.2, 1.2]}>
            {/* Cone Head - Pointing Down */}
            <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.3, 0.6, 8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>
            {/* Cylinder Shaft */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.6]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
            </mesh>
        </group>
    );
};

const InfiltrationStream = ({ position, color = "#0ea5e9" }: { position: [number, number, number], color?: string }) => {
    return (
        <group position={position}>
            {/* Static arrows distributed vertically */}
            <group position={[0, 1.0, 0]}><StaticArrow color={color} /></group>
            <group position={[0, 0.0, 0]}><StaticArrow color={color} /></group>
            <group position={[0, -1.0, 0]}><StaticArrow color={color} /></group>
        </group>
    );
};

const KarstMassif = ({ currentTime }: { currentTime: number }) => {
    const infiltrationStart = 10;
    const infiltrationDuration = 2.5; // Slower infiltration (3s)

    // Génération de blocs fissurés
    const blocks = useMemo(() => {
        const b = [];
        const rows = 4;
        const cols = 6;
        const blockSizeX = 40 / cols;
        const blockSizeZ = 60 / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                b.push({
                    x: (c * blockSizeX) - 20 + (blockSizeX / 2),
                    z: (r * blockSizeZ) - 30 + (blockSizeZ / 2),
                    h: 14 + Math.random() * 2,
                    // Which sides have fissure streams
                    hasFissureLeft: Math.random() > 0.5,
                    hasFissureRight: Math.random() > 0.5,
                    // Force front fissure on the last row (front row)
                    hasFissureFront: r === rows - 1 || Math.random() > 0.5,
                    fissureDelay: Math.random() * 1.5, // stagger per block
                    // Small cavity midway down some blocks
                    hasCavity: Math.random() > 0.7,
                    cavityY: 3 + Math.random() * 6,
                });
            }
        }
        return b;
    }, []);

    // Arbres sur le Karst
    const trees = useMemo(() => {
        return new Array(15).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 35,
            z: (Math.random() - 0.5) * 50
        }));
    }, []);

    const blockW = 40 / 6 - 0.2;
    const blockD = 60 / 4 - 0.2;

    // Global infiltration progress
    const rawProgress = currentTime >= infiltrationStart
        ? (currentTime - infiltrationStart) / infiltrationDuration
        : 0;
    const isInfiltrating = rawProgress > 0;

    return (
        <group position={[-65, 0, 0]}>
            {blocks.map((block, i) => {
                // Per-block delayed progress
                const localRaw = Math.max(0, rawProgress - block.fissureDelay / infiltrationDuration);
                const localProgress = Math.min(localRaw / (1 - block.fissureDelay / infiltrationDuration), 1);

                const streamHeight = localProgress * block.h;
                const streamTop = block.h; // start from top
                const streamYCenter = streamTop - streamHeight / 2;

                // Puddle grows as rain hits
                const puddleOpacity = Math.min(localProgress * 2, 0.7);
                const puddleScale = Math.min(localProgress * 1.5, 1);

                return (
                    <group key={i} position={[block.x, 0, block.z]}>
                        {/* The limestone block */}
                        <mesh position={[0, block.h / 2, 0]} receiveShadow castShadow>
                            <boxGeometry args={[blockW, block.h, blockD]} />
                            <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
                        </mesh>

                        {/* --- PUDDLE on top of block --- */}
                        {isInfiltrating && localProgress > 0 && (
                            <mesh
                                position={[0, block.h + 0.05, 0]}
                                rotation={[-Math.PI / 2, 0, 0]}
                                scale={[puddleScale, puddleScale, 1]}
                            >
                                <circleGeometry args={[Math.min(blockW, blockD) * 0.4, 16]} />
                                <meshStandardMaterial
                                    color="#3b82f6"
                                    emissive="#2563eb"
                                    emissiveIntensity={0.3}
                                    transparent
                                    opacity={puddleOpacity}
                                />
                            </mesh>
                        )}

                        {/* --- SIDE STREAMS (fissures) --- */}
                        {isInfiltrating && localProgress > 0.05 && (
                            <>
                                {/* Left side fissure */}
                                {block.hasFissureLeft && (
                                    <group position={[-blockW / 2 - 0.05, streamYCenter, 0]}>
                                        <mesh>
                                            <boxGeometry args={[0.3, streamHeight, 0.5]} />
                                            <meshStandardMaterial
                                                color="#2563eb"
                                                emissive="#3b82f6"
                                                emissiveIntensity={0.5}
                                                transparent
                                                opacity={0.8}
                                            />
                                        </mesh>
                                        {/* Animated Arrows Stream - LEFT side (move -X) */}
                                        {localProgress < 0.95 && (
                                            <InfiltrationStream position={[-0.3, 0, 0]} color="#0ea5e9" />
                                        )}
                                    </group>
                                )}
                                {/* Right side fissure */}
                                {block.hasFissureRight && (
                                    <group position={[blockW / 2 + 0.05, streamYCenter, 0]}>
                                        <mesh>
                                            <boxGeometry args={[0.3, streamHeight, 0.5]} />
                                            <meshStandardMaterial
                                                color="#2563eb"
                                                emissive="#3b82f6"
                                                emissiveIntensity={0.5}
                                                transparent
                                                opacity={0.8}
                                            />
                                        </mesh>
                                        {/* Animated Arrows Stream - RIGHT side (move +X) */}
                                        {localProgress < 0.95 && (
                                            <InfiltrationStream position={[0.3, 0, 0]} color="#0ea5e9" />
                                        )}
                                    </group>
                                )}
                                {/* Front side fissure */}
                                {block.hasFissureFront && (
                                    <group position={[0, streamYCenter, blockD / 2 + 0.05]}>
                                        <mesh>
                                            <boxGeometry args={[0.5, streamHeight, 0.3]} />
                                            <meshStandardMaterial
                                                color="#2563eb"
                                                emissive="#3b82f6"
                                                emissiveIntensity={0.5}
                                                transparent
                                                opacity={0.8}
                                            />
                                        </mesh>
                                        {/* Animated Arrows Stream - FRONT side (move +Z) */}
                                        {localProgress < 0.95 && (
                                            <group rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0.3]}>
                                                <InfiltrationStream position={[0, 0, 0]} color="#0ea5e9" />
                                            </group>
                                        )}
                                    </group>
                                )}
                            </>
                        )}

                        {/* --- SMALL CAVITIES --- */}
                        {isInfiltrating && block.hasCavity && localProgress > 0.4 && (
                            <mesh position={[blockW / 2 + 0.2, block.cavityY, 0]}>
                                <sphereGeometry args={[0.8, 12, 12]} />
                                <meshStandardMaterial
                                    color="#1e3a5f"
                                    emissive="#1e40af"
                                    emissiveIntensity={0.3}
                                    transparent
                                    opacity={0.6}
                                />
                            </mesh>
                        )}

                        {/* --- SPLASH at base when water reaches bottom --- */}
                        {localProgress >= 0.95 && (
                            <mesh position={[0, 0.2, 0]}>
                                <sphereGeometry args={[1, 12, 12]} />
                                <meshStandardMaterial
                                    color="#60a5fa"
                                    emissive="#3b82f6"
                                    emissiveIntensity={0.4}
                                    transparent
                                    opacity={0.5}
                                />
                            </mesh>
                        )}
                    </group>
                );
            })}

            {/* Végétation sur le massif */}
            {trees.map((t, i) => (
                <SimpleTree key={`tree-${i}`} position={[t.x, 16, t.z]} scale={0.8 + Math.random() * 0.5} />
            ))}

            <Text position={[0, 18, 0]} fontSize={4} color="#475569" rotation={[-Math.PI / 2, 0, 0]}>MASSIF KARSTIQUE</Text>
            <Text position={[20.1, 8, 0]} fontSize={2.5} color="#475569" rotation={[0, Math.PI / 2, 0]}>SOURCE</Text>
        </group>
    );
};

const RiverBedTerrain = () => {
    return (
        <group>
            {/* Sol infini simulé par un grand plan */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5.1, 0]} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial color="#e2e8f0" roughness={1} />
            </mesh>

            {/* Le Lit de la rivière */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
                <planeGeometry args={[RIVER_LENGTH + 40, 12]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.8} />
            </mesh>

            {/* Rives surélevées pour donner du volume */}
            <mesh position={[0, -2.5, -10]} rotation={[0, 0, 0]}>
                <boxGeometry args={[RIVER_LENGTH + 40, 5, 8]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <mesh position={[0, -2.5, 10]} rotation={[0, 0, 0]}>
                <boxGeometry args={[RIVER_LENGTH + 40, 5, 8]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        </group>
    )
}

const DynamicWater = ({ data, currentTime }: { data: HydroDataPoint[], currentTime: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => new THREE.PlaneGeometry(RIVER_LENGTH, RIVER_WIDTH_BASE, SEGMENTS, 1), []);

    useFrame(() => {
        if (!meshRef.current) return;
        const currentData = data.find(d => d.time >= currentTime) || data[data.length - 1];
        const pos = meshRef.current.geometry.attributes.position;

        // Positions approximatives X des stations
        const xStZach = -35;
        const xRoq = -10;
        const xAub = 20;
        const xMars = 50;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            let level = 0;

            // Interpolation
            if (x < xStZach) level = currentData.stZacharie * 0.5;
            else if (x < xRoq) level = THREE.MathUtils.lerp(currentData.stZacharie, currentData.roquevaire, (x - xStZach) / (xRoq - xStZach));
            else if (x < xAub) level = THREE.MathUtils.lerp(currentData.roquevaire, currentData.aubagne, (x - xRoq) / (xAub - xRoq));
            else level = THREE.MathUtils.lerp(currentData.aubagne, currentData.marseille, Math.min((x - xAub) / (xMars - xAub), 1));

            // EXAGERATION VERTICALE pour la visualisation
            const zHeight = -4.5 + (level * 2.5);
            pos.setZ(i, zHeight);

            // Largeur augmente avec le niveau
            const originalY = (i % 2 === 0) ? 1 : -1;
            pos.setY(i, originalY * (RIVER_WIDTH_BASE / 2 + level * 0.8));
        }
        meshRef.current.geometry.attributes.position.needsUpdate = true;
        meshRef.current.geometry.computeVertexNormals();

        // Couleur dynamique
        const mat = meshRef.current.material as THREE.MeshPhysicalMaterial;
        if (currentTime > 14) {
            mat.color.lerp(new THREE.Color("#2563eb"), 0.1);
        } else {
            mat.color.lerp(new THREE.Color("#60a5fa"), 0.1);
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
            <meshPhysicalMaterial
                color="#3b82f6"
                transmission={0.3}
                thickness={1}
                roughness={0.1}
                ior={1.33}
            />
        </mesh>
    );
};

const RunoffArrows = ({ currentTime }: { currentTime: number }) => {
    const active = currentTime > 0.5 && currentTime < 11;
    const count = 150;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    // Cloud front X position (same logic as RainFrontSystem)
    const cloudStartX = 60;
    const cloudEndX = -60;
    const cloudX = THREE.MathUtils.lerp(cloudStartX, cloudEndX, Math.min(currentTime / 11, 1));
    // Arrows appear in a band behind/around the cloud front
    const bandWidth = 40; // width of the active runoff zone behind the cloud

    const items = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            localX: Math.random(), // 0-1, will be mapped to cloud band
            side: Math.random() > 0.5 ? 1 : -1,
            offset: Math.random() * 20,
            speed: 5 + Math.random() * 5
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.visible = active;
        if (!active) return;

        const time = state.clock.getElapsedTime();

        items.forEach((item, i) => {
            const progress = (time * item.speed + item.offset) % 30;

            // Map localX into the band: from cloudX to cloudX + bandWidth (downstream)
            const xPos = cloudX + item.localX * bandWidth;

            let zPos = 0;
            let yRot = 0;

            if (item.side === 1) {
                zPos = 40 - progress;
                if (zPos < 6) zPos = 40;
                yRot = Math.PI;
            } else {
                zPos = -40 + progress;
                if (zPos > -6) zPos = -40;
                yRot = 0;
            }

            dummy.position.set(xPos, 0, zPos);
            dummy.rotation.set(-Math.PI / 2, 0, yRot);
            dummy.scale.set(1, 2, 1);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <coneGeometry args={[0.5, 2, 8]} />
            <meshBasicMaterial color="#0284c7" />
        </instancedMesh>
    );
};

// --- Karst Labels (Infiltration + Discharge) ---
const KarstLabels = ({ currentTime }: { currentTime: number }) => {
    const infiltrationStart = 10;
    const infiltrationDuration = 3; // synced with KarstMassif
    const rawProgress = currentTime >= infiltrationStart
        ? (currentTime - infiltrationStart) / infiltrationDuration
        : 0;
    const progress = Math.min(rawProgress, 1);

    // Position for discharge text (St Zacharie)
    const textLocalX = 30; // -65 + 30 = -35
    const textLocalZ = 45; // 0 + 45 = 45 (Front)

    if (progress <= 0) return null;

    return (
        <group position={[-65, 0, 0]}>
            {/* Label when infiltration is active - On top of Karst */}
            {/* Disappears after infiltration phase (approx T=15) */}
            {progress > 0.1 && currentTime < 15 && (
                <Float speed={2} floatIntensity={0.5} floatingRange={[0, 1]}>
                    <Text
                        position={[0, 22, 0]}
                        fontSize={3}
                        color="#1d4ed8"
                        outlineWidth={0.1}
                        outlineColor="white"
                    >
                        INFILTRATION KARSTIQUE
                    </Text>
                </Float>
            )}

            {/* Label when water reaches base = discharge - At St Zacharie - Front */}
            {/* Disappears after flood recession (approx T=26) */}
            {progress >= 0.95 && currentTime < 26 && (
                <Float speed={2} floatIntensity={0.5} floatingRange={[0, 1]}>
                    <Text
                        position={[textLocalX, 10, textLocalZ]}
                        fontSize={2.5}
                        color="#dc2626"
                        outlineWidth={0.1}
                        outlineColor="white"
                        fontWeight="bold"
                    >
                        DÉCHARGE KARSTIQUE
                    </Text>
                </Float>
            )}
        </group>
    );
};

const Limnimeter = ({ position, name, color, level }: { position: [number, number, number], name: string, color: string, level: number }) => {
    // Échelle visuelle TRES exagérée pour bien voir la montée
    // 1m réel = 8 unités 3D (au lieu de 4 précédemment)
    const visualScale = 8;
    const visualHeight = Math.max(0.2, level * visualScale);

    // Diamètre du tube
    const radius = 1;

    // Le fond du tube est à Y = -5
    const bottomY = -5;
    const centerY = bottomY + (visualHeight / 2);
    const topSurfaceY = bottomY + visualHeight;

    return (
        <group position={position}>
            {/* Structure Poteau */}
            <mesh position={[-2, 5, 0]} castShadow>
                <boxGeometry args={[0.5, 20, 0.5]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[-1, 14, 0]}>
                <boxGeometry args={[2.5, 0.4, 0.5]} />
                <meshStandardMaterial color="#475569" />
            </mesh>

            {/* Tube en verre (Plus large) */}
            <mesh position={[0, 4.5, 0]}>
                <cylinderGeometry args={[radius + 0.1, radius + 0.1, 19, 32]} />
                <meshPhysicalMaterial
                    color="white"
                    transparent
                    opacity={0.1}
                    roughness={0}
                    transmission={0.9}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* LIQUIDE BLEU : Hauteur dynamique */}
            <mesh position={[0, centerY, 0]}>
                <cylinderGeometry args={[radius, radius, visualHeight, 32]} />
                <meshStandardMaterial
                    color="#2563eb"
                    emissive="#3b82f6"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* FLOTTEUR ROUGE (Indicateur de niveau) */}
            <mesh position={[0, topSurfaceY, 0]}>
                <cylinderGeometry args={[radius - 0.1, radius - 0.1, 0.5, 32]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
            </mesh>

            {/* Graduations */}
            {[...Array(10)].map((_, i) => (
                <mesh key={i} position={[0, -5 + i * 2, radius + 0.15]}>
                    <boxGeometry args={[1.5, 0.1, 0.1]} />
                    <meshBasicMaterial color="#1e293b" />
                </mesh>
            ))}

            {/* Étiquette */}
            <group position={[0, 16.5, 0]}>
                <mesh>
                    <planeGeometry args={[9, 3]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[9.2, 3.2]} />
                    <meshStandardMaterial color="white" />
                </mesh>
                <Text position={[0, 0.5, 0.1]} fontSize={0.9} color="white" fontWeight="bold">{name}</Text>
                <Text position={[0, -0.6, 0.1]} fontSize={1} color="white" fontWeight="bold">{level.toFixed(2)}m</Text>
            </group>
        </group>
    );
};

// --- Composant spécifique pour la Pluie Tombante ---
const FallingRain = () => {
    const count = 1000;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = new THREE.Object3D();

    // Initialisation des positions aléatoires
    const drops = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 20, // Largeur sous le nuage (X)
            y: Math.random() * 20,         // Hauteur initiale (Y)
            z: (Math.random() - 0.5) * 40, // Profondeur sous le nuage (Z)
            speed: 0.5 + Math.random() * 0.5 // Vitesse de chute
        }));
    }, []);

    useFrame(() => {
        if (!meshRef.current) return;

        drops.forEach((drop, i) => {
            // Faire tomber la goutte
            drop.y -= drop.speed;

            // Réinitialiser en haut si elle dépasse le bas
            if (drop.y < -5) {
                drop.y = 20;
            }

            dummy.position.set(drop.x, drop.y, drop.z);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} position={[0, 0, 0]}>
            {/* Forme de goutte allongée (trait) */}
            <cylinderGeometry args={[0.05, 0.05, 1.5, 4]} />
            {/* Pluie plus sombre */}
            <meshBasicMaterial color="#2563eb" opacity={0.7} transparent />
        </instancedMesh>
    );
};


// Gros système pluvieux unique
const RainFrontSystem = ({ currentTime }: { currentTime: number }) => {
    if (currentTime > 12) return null;

    // Déplacement de l'Aval (Marseille X=50) vers l'Amont (Source X=-50)
    const startX = 60;
    const endX = -60;
    const xPos = THREE.MathUtils.lerp(startX, endX, currentTime / 11);

    return (
        <group position={[xPos, 0, 0]}>
            {/* Nuages massifs */}
            <group position={[0, 25, 0]}>
                <Cloud opacity={0.7} speed={0.2} bounds={[15, 4, 30]} segments={40} color="#64748b" volume={15} />
            </group>

            {/* Pluie tombante animée */}
            <FallingRain />
        </group>
    )
}

const FloodSimulation: React.FC<SimulationProps> = ({ data, currentTime, isPlaying, onTogglePlay }) => {
    const currentData = data.find(d => d.time >= currentTime) || data[data.length - 1];
    const [cameraTargetX, setCameraTargetX] = useState(10);

    const xStZach = -35;
    const xRoq = -10;
    const xAub = 20;
    const xMars = 50;

    // Arbres aléatoires pour la zone amont (St Zacharie)
    const treesAmont = useMemo(() => {
        return new Array(10).fill(0).map(() => ({
            x: xStZach + (Math.random() - 0.5) * 20,
            z: (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 5)
        }));
    }, [xStZach]);

    return (
        <div className="flex flex-col w-full h-full bg-[#e0f2fe] rounded-xl overflow-hidden shadow-xl border border-slate-300 relative group">

            {/* 3D Canvas */}
            <div className="flex-1 relative">
                <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                    {/* Configuration Environnement - SUPPRESSION DU BROUILLARD POUR NETTETÉ */}
                    <color attach="background" args={['#e0f2fe']} />

                    <CameraController targetX={cameraTargetX} />
                    <PerspectiveCamera makeDefault position={[cameraTargetX, 35, 80]} fov={40} />
                    <OrbitControls
                        target={[cameraTargetX, 0, 0]}
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={40}
                        maxDistance={200} // Augmenté pour permettre un dézoom net
                        enablePan={false}
                    />

                    {/* Lumières */}
                    <ambientLight intensity={1} color="#ffffff" />
                    <hemisphereLight args={["#ffffff", "#bfdbfe", 0.8]} />
                    <directionalLight position={[-20, 50, 20]} intensity={1.5} castShadow shadow-bias={-0.0005} color="#fff7ed" />

                    {/* Scene Elements */}
                    <KarstMassif currentTime={currentTime} />
                    <RiverBedTerrain />
                    <DynamicWater data={data} currentTime={currentTime} />
                    <RunoffArrows currentTime={currentTime} />
                    <RainFrontSystem currentTime={currentTime} />
                    <KarstLabels currentTime={currentTime} />

                    {/* Végétation Zone Amont */}
                    {treesAmont.map((t, i) => (
                        <SimpleTree key={`tree-amont-${i}`} position={[t.x, 0, t.z]} />
                    ))}

                    {/* --- Stations & Urbanisation --- */}

                    {/* St Zacharie (2 maisons, village amont) */}
                    <group position={[xStZach, 0, 0]}>
                        <Limnimeter position={[0, 0, 8]} name="St Zacharie" color={STATION_COLORS.stZacharie} level={currentData.stZacharie} />
                        <CityGroup position={[0, 0, -15]} count={2} spread={10} />
                    </group>

                    {/* Roquevaire (2 maisons) */}
                    <group position={[xRoq, 0, 0]}>
                        <Limnimeter position={[0, 0, 8]} name="Roquevaire" color={STATION_COLORS.roquevaire} level={currentData.roquevaire} />
                        <CityGroup position={[0, 0, -15]} count={2} spread={10} />
                    </group>

                    {/* Aubagne (5 maisons, ville) */}
                    <group position={[xAub, 0, 0]}>
                        <Limnimeter position={[0, 0, 8]} name="Aubagne" color={STATION_COLORS.aubagne} level={currentData.aubagne} />
                        <CityGroup position={[0, 0, -20]} count={5} spread={20} />
                        <CityGroup position={[0, 0, 20]} count={3} spread={15} />
                    </group>

                    {/* Marseille (10 maisons, grande ville) */}
                    <group position={[xMars, 0, 0]}>
                        <Limnimeter position={[0, 0, 8]} name="Marseille" color={STATION_COLORS.marseille} level={currentData.marseille} />
                        <CityGroup position={[0, 0, -20]} count={10} spread={30} />
                        <CityGroup position={[0, 0, 20]} count={5} spread={20} />
                    </group>


                    {/* Textes contextuels */}
                    <Float speed={2} floatIntensity={0.5} floatingRange={[0, 1]}>
                        {currentTime > 2 && currentTime < 11 && (
                            <Text position={[0, 15, 0]} fontSize={4} color="#0369a1" outlineWidth={0.1} outlineColor="white">
                                RUISSELLEMENT DE SURFACE
                            </Text>
                        )}
                    </Float>
                </Canvas>
            </div>

            {/* Légende et Infos */}
            <div className="flex-none bg-white p-4 border-t border-slate-200 flex flex-col gap-4 z-30 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-1 max-w-md shadow-inner">
                        <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Vue Source</span>
                        <input
                            type="range"
                            min="-45"
                            max="55"
                            step="0.5"
                            value={cameraTargetX}
                            onChange={(e) => setCameraTargetX(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Embouchure</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-slate-500 text-xs font-bold">STATIONS :</div>
                        <div className="flex gap-2 text-[10px] font-medium text-slate-700">
                            <span className="px-2 py-1 rounded bg-[#06b6d4] text-white">St Zacharie</span>
                            <span className="px-2 py-1 rounded bg-[#22c55e] text-white">Roquevaire</span>
                            <span className="px-2 py-1 rounded bg-[#f59e0b] text-white">Aubagne</span>
                            <span className="px-2 py-1 rounded bg-[#3b82f6] text-white">Marseille</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⬇️</span>
                        <div>
                            <div className="text-sky-600 text-xs font-bold uppercase">Ruissellement</div>
                            <div className="text-slate-500 text-[10px]">Flèches Bleues (T0-T11)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-8 bg-slate-200 border border-slate-300 relative rounded-sm overflow-hidden">
                            <div className="absolute bottom-0 w-full h-3/4 bg-blue-600 animate-pulse"></div>
                        </div>
                        <div>
                            <div className="text-blue-600 text-xs font-bold uppercase">Limnimètre</div>
                            <div className="text-slate-500 text-[10px]">Mesure de hauteur</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloodSimulation;