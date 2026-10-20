/**
 * VISIONCAP — Advanced Holographic Particle Simulations
 * Upgrades the AI Neural Core with 3 interactive Three.js mathematical particle fields:
 * 1. VEXIS Neural Firing Brain (Synaptic Awareness & Perception)
 * 2. Black Hole Singularity (Relativistic Gravitational Accretion Disk)
 * 3. Quantum Tesseract (Interlocking Toroidal Knot & Celestial Stardust)
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class BaseParticleSimulation {
    constructor(container, count = 4500) {
        this.container = container;
        this.count = count;
        this.disposed = false;
        this.animId = null;
        this.speedMult = 1.26446;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;

        // SCENE & CAMERA
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 100);

        // RENDERER - Pure alpha transparency for borderless blending
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.domElement.style.background = 'transparent';
        this.renderer.domElement.style.display = 'block';
        this.container.appendChild(this.renderer.domElement);

        // POST PROCESSING BLOOM
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(width, height),
            1.5,
            0.4,
            0.85
        );
        bloomPass.strength = 1.6;
        bloomPass.radius = 0.35;
        bloomPass.threshold = 0.05;
        this.composer.addPass(bloomPass);

        // INSTANCED MESH
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();

        this.geometry = new THREE.TetrahedronGeometry(0.26);
        this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        this.positions = [];
        for (let i = 0; i < this.count; i++) {
            this.positions.push(
                new THREE.Vector3(
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 80
                )
            );
            this.mesh.setColorAt(i, this.color.setHex(0x00ff88));
        }

        this.clock = new THREE.Clock();

        // RESIZE OBSERVER
        this.handleResize = this.handleResize.bind(this);
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.handleResize);
            this.resizeObserver.observe(this.container);
        }
    }

    handleResize() {
        if (this.disposed || !this.container) return;
        const width = this.container.clientWidth || 300;
        const height = this.container.clientHeight || 300;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    dispose() {
        this.disposed = true;
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.resizeObserver) this.resizeObserver.disconnect();

        try {
            this.geometry.dispose();
            this.material.dispose();
            this.scene.remove(this.mesh);
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
            this.renderer.dispose();
        } catch (e) {
            console.warn('[Simulation] Dispose cleanup notice:', e);
        }
    }
}

// ═════════════════════════════════════════════════════════════════
// 1. VEXIS NEURAL FIRING BRAIN SIMULATION
// ═════════════════════════════════════════════════════════════════
export class NeuralBrainSimulation extends BaseParticleSimulation {
    constructor(container, count = 4500) {
        super(container, count);
        this.params = {
            speed: 0.9,
            fire: 0.55,
            size: 58,
            depth: 28,
            pulsePower: 0.65
        };

        this.animate = this.animate.bind(this);
        this.animate();
    }

    setStatus(status = 'idle') {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'listening':
                this.params.speed = 1.2;
                this.params.fire = 0.75;
                this.params.pulsePower = 0.8;
                break;
            case 'decoding':
            case 'analyzing':
                this.params.speed = 1.8;
                this.params.fire = 0.95;
                this.params.pulsePower = 1.0;
                break;
            case 'thinking':
                this.params.speed = 1.5;
                this.params.fire = 0.85;
                this.params.pulsePower = 0.9;
                break;
            case 'speaking':
                this.params.speed = 1.0;
                this.params.fire = 0.65;
                this.params.pulsePower = 0.6;
                break;
            case 'error':
                this.params.speed = 0.4;
                this.params.fire = 0.2;
                this.params.pulsePower = 0.2;
                break;
            default: // idle
                this.params.speed = 0.9;
                this.params.fire = 0.55;
                this.params.pulsePower = 0.65;
        }
    }

    animate() {
        if (this.disposed) return;
        this.animId = requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime() * this.speedMult;
        const count = this.count;
        const { speed, fire, size, depth, pulsePower } = this.params;

        for (let i = 0; i < count; i++) {
            const target = this.target;
            const color = this.pColor;

            const n = count > 1 ? i / (count - 1) : 0;
            const side = i % 2 === 0 ? -1.0 : 1.0;
            const h = n * 2.0 - 1.0;
            const a = i * 2.399963229728653;
            const t = time * speed;

            const lobe = Math.sqrt(Math.max(0.0, 1.0 - h * h));
            const foldA = Math.sin(a * 3.0 + h * 8.0 + t * 0.8);
            const foldB = Math.cos(a * 5.0 - h * 5.0 - t * 0.6);
            const foldC = Math.sin(a * 8.0 + t * 1.4);

            const brainTop = 1.0 - Math.max(0.0, -h) * 0.42;
            const brainBase = 1.0 - Math.max(0.0, h + 0.25) * 0.12;
            const r = size * lobe * brainTop * brainBase * (0.72 + 0.18 * foldA + 0.08 * foldB);

            const split = 7.0 + Math.abs(h) * 4.0;
            const x = side * split + Math.cos(a) * r * 0.72;
            const y = h * size * 0.72 + foldB * 4.0;
            const z = Math.sin(a) * depth * (0.35 + lobe * 0.65) + foldC * fire * 5.0;

            const wave1 = Math.sin(t * 5.0 + n * 60.0 + foldA * 2.0);
            const wave2 = Math.sin(t * 7.0 - Math.abs(x) * 0.22 + y * 0.08);
            const firing = Math.pow(Math.max(0.0, wave1 * wave2), 8.0) * fire;

            const snapX = Math.sin(t * 2.5 + n * 30.0) * firing * pulsePower * 10.0;
            const snapY = Math.cos(t * 2.1 + n * 24.0) * firing * pulsePower * 6.0;
            const snapZ = Math.sin(t * 3.3 + n * 18.0) * firing * pulsePower * 10.0;

            target.set(x + snapX, y + snapY, z + snapZ);

            const hueBase = 0.56 + 0.18 * Math.sin(n * 12.0 + t * 0.7);
            const hueFire = 0.08 + 0.42 * Math.sin(n * 40.0 + t * 4.0);
            const hueMix = firing;
            const hue = hueBase * (1.0 - hueMix) + hueFire * hueMix;
            const sat = 0.45 + firing * 0.55;
            const light = 0.14 + firing * 0.72 + lobe * 0.08;

            color.setHSL(hue, sat, light);

            this.positions[i].lerp(target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        // Slow atmospheric rotation
        this.mesh.rotation.y = time * 0.08;

        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
}

// ═════════════════════════════════════════════════════════════════
// 2. BLACK HOLE SINGULARITY SIMULATION
// ═════════════════════════════════════════════════════════════════
export class SingularitySimulation extends BaseParticleSimulation {
    constructor(container, count = 4500) {
        super(container, count);
        this.camera.position.set(0, 35, 110);
        this.camera.lookAt(0, 0, 0);

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.style.background = 'transparent';

        // Individual particle geometry
        this.geometry.dispose();
        this.geometry = new THREE.TetrahedronGeometry(0.64);
        this.mesh.geometry = this.geometry;

        this.material.transparent = true;
        this.material.opacity = 0.95;
        this.material.blending = THREE.AdditiveBlending;
        this.material.depthWrite = false;

        this.params = {
            scale: 68,
            spin: 3.0,
            accretion: 1.0,
            warp: 1.2,
            tilt: 15
        };

        // Tilt the singularity accretion disk by 15 degrees
        this.mesh.rotation.z = THREE.MathUtils.degToRad(this.params.tilt);

        this.animate = this.animate.bind(this);
        this.animate();
    }

    setStatus(status = 'idle') {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'listening':
                this.params.spin = 3.8;
                this.params.accretion = 1.3;
                this.params.warp = 1.4;
                break;
            case 'decoding':
            case 'analyzing':
            case 'thinking':
                this.params.spin = 5.2;
                this.params.accretion = 1.8;
                this.params.warp = 2.0;
                break;
            case 'speaking':
                this.params.spin = 3.2;
                this.params.accretion = 1.1;
                this.params.warp = 1.2;
                break;
            default:
                this.params.spin = 3.0;
                this.params.accretion = 1.0;
                this.params.warp = 1.2;
        }
    }

    animate() {
        if (this.disposed) return;
        this.animId = requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime() * this.speedMult;
        const count = this.count;
        const { scale, spin, accretion, warp } = this.params;

        for (let i = 0; i < count; i++) {
            const target = this.target;
            const color = this.pColor;

            const u = (i + 0.5) / count;
            const ga = 2.399963229728653;
            const a = i * ga;

            const t = time * 0.35;
            const band = u * 24.0 - 12.0;

            const disk = 1.0 - Math.abs(Math.sin(band * 0.5));
            const radius = scale * (0.08 + 1.9 * u * u);

            const swirl = a + spin * Math.log(radius + 1.0) - t * (2.0 + 3.0 * (1.0 - u));

            const grav = 1.0 / (1.0 + radius * 0.015);
            const bend = warp * grav * grav;

            const x0 = radius * Math.cos(swirl);
            const z0 = radius * Math.sin(swirl);

            const x = x0 + bend * z0;
            const z = z0 - bend * x0;
            const y = scale * 0.22 * disk * Math.sin(a * 0.17 + t * 4.0) * accretion;

            target.set(x, y, z);

            const heat = 1.0 - Math.min(1.0, radius / (scale * 2.0));
            const hue = 0.08 + 0.58 * (1.0 - heat);
            const sat = 0.8 + 0.2 * heat;

            // Smooth outer rim fade so particles blend seamlessly without any hard cut-off border
            const edgeFade = Math.max(0.0, 1.0 - Math.pow(u, 2.2));
            const light = (0.15 + 0.55 * Math.pow(heat, 1.5)) * edgeFade;

            color.setHSL(hue, sat, Math.max(0, light));

            this.positions[i].lerp(target, 0.1);
            this.dummy.position.copy(this.positions[i]);

            // Subtle scale modulation: central accretion ring is bolder, outer stardust dissolves into darkness
            const pScale = (1.0 + 0.45 * heat) * Math.max(0.05, edgeFade);
            this.dummy.scale.set(pScale, pScale, pScale);
            this.dummy.updateMatrix();

            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
}

// ═════════════════════════════════════════════════════════════════
// 3. QUANTUM TESSERACT / TOROIDAL KNOT SIMULATION
// ═════════════════════════════════════════════════════════════════
export class QuantumKnotSimulation extends BaseParticleSimulation {
    constructor(container, count = 4500) {
        super(container, count);
        this.camera.position.set(0, 0, 115);

        this.params = {
            macroRadius: 50,
            microRadius: 15,
            pLoops: 2,
            qTwists: 5,
            blocks: 350,
            length: 7.0,
            size: 2.5,
            stagger: 4.0,
            twist: 1.5,
            flow: 0.3
        };

        this.animate = this.animate.bind(this);
        this.animate();
    }

    setStatus(status = 'idle') {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'listening':
                this.params.flow = 0.6;
                this.params.twist = 2.0;
                break;
            case 'decoding':
            case 'analyzing':
            case 'thinking':
                this.params.flow = 1.2;
                this.params.twist = 3.2;
                break;
            case 'speaking':
                this.params.flow = 0.5;
                this.params.twist = 1.8;
                break;
            default:
                this.params.flow = 0.3;
                this.params.twist = 1.5;
        }
    }

    animate() {
        if (this.disposed) return;
        this.animId = requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime() * this.speedMult;
        const count = this.count;
        const {
            macroRadius: R,
            microRadius: r,
            pLoops: P,
            qTwists: Q,
            blocks: numBlocks,
            length: pLen,
            size: pSize,
            stagger,
            twist: extraTwist,
            flow
        } = this.params;

        const stardustRatio = 0.05;
        const numStardust = count * stardustRatio;

        const gRx = time * 0.11;
        const gRy = time * 0.17;
        const cgx = Math.cos(gRx), sgx = Math.sin(gRx);
        const cgy = Math.cos(gRy), sgy = Math.sin(gRy);

        for (let i = 0; i < count; i++) {
            const target = this.target;
            const color = this.pColor;

            if (i < numStardust) {
                const raw1 = Math.sin(i * 11.11) * 43758.54;
                const sd1 = raw1 - Math.floor(raw1);
                const raw2 = Math.cos(i * 22.22) * 43758.54;
                const sd2 = raw2 - Math.floor(raw2);
                const raw3 = Math.sin(i * 33.33) * 43758.54;
                const sd3 = raw3 - Math.floor(raw3);

                const radiusDist = R * 1.2 + sd1 * 80.0;
                const theta = sd2 * Math.PI * 2.0;
                const phi = Math.acos(sd3 * 2.0 - 1.0);

                const driftX = Math.sin(time * 0.2 + i * 0.1) * 10.0;
                const driftY = Math.cos(time * 0.25 + i * 0.1) * 10.0;
                const driftZ = Math.sin(time * 0.15 + i * 0.2) * 10.0;

                const sx = radiusDist * Math.sin(phi) * Math.cos(theta) + driftX;
                const sy = radiusDist * Math.sin(phi) * Math.sin(theta) + driftY;
                const sz = radiusDist * Math.cos(phi) + driftZ;

                const y1 = sy * cgx - sz * sgx;
                const z1 = sy * sgx + sz * cgx;
                const x2 = sx * cgy + z1 * sgy;
                const y2 = y1;
                const z2 = -sx * sgy + z1 * cgy;

                target.set(x2, y2, z2);

                const twinkle = Math.pow((Math.sin(time * 3.0 + i) + 1.0) * 0.5, 8.0);
                color.setHSL(0.5 + sd1 * 0.1, 0.8, 0.05 + twinkle * 0.8);
            } else {
                const remainingCount = count - numStardust;
                const iRem = i - numStardust;

                const blocksSafe = Math.max(1, numBlocks);
                const ppb = remainingCount / blocksSafe;
                const blockId = Math.floor(iRem / ppb);
                const localId = iRem - blockId * ppb;

                const wireRatio = 0.85;
                const numWire = ppb * wireRatio;
                const isWire = localId < numWire;

                const tBase = (blockId / blocksSafe) * Math.PI * 2.0;
                const t = tBase + time * flow * 0.1;

                const cosQt = Math.cos(Q * t);
                const sinQt = Math.sin(Q * t);
                const cosPt = Math.cos(P * t);
                const sinPt = Math.sin(P * t);

                const px = (R + r * cosQt) * cosPt;
                const py = (R + r * cosQt) * sinPt;
                const pz = r * sinQt;

                let tx = -P * (R + r * cosQt) * sinPt - Q * r * sinQt * cosPt;
                let ty = P * (R + r * cosQt) * cosPt - Q * r * sinQt * sinPt;
                let tz = Q * r * cosQt;
                const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) + 0.0001;
                tx /= tLen; ty /= tLen; tz /= tLen;

                const nx_torus = cosPt;
                const ny_torus = sinPt;
                const nz_torus = 0.0;

                let bx = ty * nz_torus - tz * ny_torus;
                let by = tz * nx_torus - tx * nz_torus;
                let bz = tx * ny_torus - ty * nx_torus;
                const bLen = Math.sqrt(bx * bx + by * by + bz * bz) + 0.0001;
                bx /= bLen; by /= bLen; bz /= bLen;

                let nx = by * tz - bz * ty;
                let ny = bz * tx - bx * tz;
                let nz = bx * ty - by * tx;

                const twistAngle = tBase * extraTwist + time * flow * 0.5;
                const cosTw = Math.cos(twistAngle);
                const sinTw = Math.sin(twistAngle);

                const fnx = nx * cosTw - bx * sinTw;
                const fny = ny * cosTw - by * sinTw;
                const fnz = nz * cosTw - bz * sinTw;

                const fbx = nx * sinTw + bx * cosTw;
                const fby = ny * sinTw + by * cosTw;
                const fbz = nz * sinTw + bz * cosTw;

                const track = blockId % 4;
                const c1 = track % 2 === 0 ? 1.0 : -1.0;
                const c2 = Math.floor(track / 2) === 0 ? 1.0 : -1.0;

                const cx = px + fnx * c1 * stagger + fbx * c2 * stagger;
                const cy = py + fny * c1 * stagger + fby * c2 * stagger;
                const cz = pz + fnz * c1 * stagger + fbz * c2 * stagger;

                let lx = 0.0, ly = 0.0, lz = 0.0;
                let u = 0.0;

                if (isWire) {
                    const edgePosRaw = (localId / numWire) * 12.0;
                    const edgeId = Math.min(11, Math.floor(edgePosRaw));
                    u = (edgePosRaw - edgeId) * 2.0 - 1.0;

                    const axis = edgeId % 3;
                    const corner = Math.floor(edgeId / 3);
                    const e1 = corner % 2 === 0 ? -1.0 : 1.0;
                    const e2 = Math.floor(corner / 2) === 0 ? -1.0 : 1.0;

                    if (axis === 0) { lx = u; ly = e1; lz = e2; }
                    else if (axis === 1) { lx = e1; ly = u; lz = e2; }
                    else { lx = e1; ly = e2; lz = u; }
                } else {
                    const rawS1 = Math.sin(localId * 12.989 + blockId * 78.233) * 43758.545;
                    const rawS2 = Math.cos(localId * 39.346 + blockId * 53.211) * 43758.545;
                    const rawS3 = Math.sin(localId * 73.156 + blockId * 12.742) * 43758.545;
                    const rawS4 = Math.cos(localId * 23.456 + blockId * 89.123) * 43758.545;

                    const s1 = rawS1 - Math.floor(rawS1);
                    const s2 = rawS2 - Math.floor(rawS2);
                    const s3 = rawS3 - Math.floor(rawS3);
                    const s4 = rawS4 - Math.floor(rawS4);

                    const faceAxis = Math.min(2, Math.floor(s1 * 3.0));
                    const signFace = s2 > 0.5 ? 1.0 : -1.0;
                    const u2 = s3 * 2.0 - 1.0;
                    const v2 = s4 * 2.0 - 1.0;

                    u = 0.0;

                    if (faceAxis === 0) { lx = signFace; ly = u2; lz = v2; }
                    else if (faceAxis === 1) { lx = u2; ly = signFace; lz = v2; }
                    else { lx = u2; ly = v2; lz = signFace; }
                }

                lx *= pLen;
                ly *= pSize;
                lz *= pSize;

                const fx = cx + lx * tx + ly * fnx + lz * fbx;
                const fy = cy + lx * ty + ly * fny + lz * fby;
                const fz = cz + lx * tz + ly * fnz + lz * fbz;

                const y1 = fy * cgx - fz * sgx;
                const z1 = fy * sgx + fz * cgx;
                const x2 = fx * cgy + z1 * sgy;
                const y2 = y1;
                const z2 = -fx * sgy + z1 * cgy;

                target.set(x2, y2, z2);

                const trackOffset = (track / 4.0) * 0.08;
                const hue = 0.5 + trackOffset + Math.sin(tBase * P * 2.0 + time) * 0.02;

                let sat = isWire ? 0.95 : 0.5;
                let lit = isWire ? 0.3 : 0.02;

                if (isWire) {
                    const pulseEnv = Math.sin(tBase * P * 12.0 - time * 5.0);
                    if (pulseEnv > 0.8) {
                        lit += (pulseEnv - 0.8) * 3.0;
                    }

                    const isCorner = Math.abs(u) > 0.90 ? 1.0 : 0.0;
                    lit += isCorner * 0.6;
                    sat -= isCorner * 0.8;
                }

                color.setHSL(hue % 1.0, Math.min(1.0, Math.max(0.0, sat)), Math.min(1.0, Math.max(0.0, lit)));
            }

            this.positions[i].lerp(target, 0.1);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
}

// ═════════════════════════════════════════════════════════════════
// 4. BIO-MACROMOLECULAR CAPSID & VIRION CORE (ParticlesSwarm)
// ═════════════════════════════════════════════════════════════════
// Pre-calculate normalized icosahedron vertices once for high performance
const PHI = (1 + Math.sqrt(5)) / 2;
const RAW_ICO_VERTS = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
];
const NORMALIZED_ICO_VERTS = RAW_ICO_VERTS.map(v => {
    const m = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / m, v[1] / m, v[2] / m];
});

export class BioCapsidSimulation extends BaseParticleSimulation {
    constructor(container, count = 6500) {
        super(container, count);
        this.camera.position.set(0, 0, 62);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));

        this.geometry.dispose();
        this.geometry = new THREE.TetrahedronGeometry(0.27);
        this.mesh.geometry = this.geometry;

        this.material.transparent = true;
        this.material.opacity = 1.0;
        this.material.blending = THREE.AdditiveBlending;
        this.material.depthWrite = false;

        this.speedMult = 1.2644607573747635;
        this.params = {
            scale: 25,
            rotate: 0.5,
            pulse: 0.2
        };

        this.animate = this.animate.bind(this);
        this.animate();
    }

    setStatus(status = 'idle') {
        const s = (status || '').toLowerCase();
        switch (s) {
            case 'listening':
                this.params.rotate = 0.85;
                this.params.pulse = 0.45;
                this.params.scale = 25.6;
                break;
            case 'decoding':
            case 'analyzing':
                this.params.rotate = 1.4;
                this.params.pulse = 0.7;
                this.params.scale = 25.8;
                break;
            case 'thinking':
                this.params.rotate = 1.2;
                this.params.pulse = 0.6;
                this.params.scale = 26.2;
                break;
            case 'speaking':
                this.params.rotate = 0.65;
                this.params.pulse = 0.35;
                this.params.scale = 25.2;
                break;
            case 'error':
                this.params.rotate = 0.25;
                this.params.pulse = 0.1;
                this.params.scale = 23;
                break;
            default: // idle
                this.params.rotate = 0.5;
                this.params.pulse = 0.2;
                this.params.scale = 25;
        }
    }

    animate() {
        if (this.disposed) return;
        this.animId = requestAnimationFrame(this.animate);

        const time = this.clock.getElapsedTime() * this.speedMult;
        const count = this.count;
        const S = this.params.scale;
        const spd = this.params.rotate;
        const pulse = this.params.pulse;

        const t = time * spd;
        const breathe = 1 + Math.sin(t * 2) * pulse * 0.07;
        const cosA = Math.cos(t * 0.35);
        const sinA = Math.sin(t * 0.35);

        for (let i = 0; i < count; i++) {
            const target = this.target;
            const color = this.pColor;
            const ratio = i / count;
            const phi_angle = Math.acos(1 - 2 * (i + 0.5) / count);
            const theta = Math.PI * (3 - Math.sqrt(5)) * i;

            let cx = Math.sin(phi_angle) * Math.cos(theta);
            let cy = Math.sin(phi_angle) * Math.sin(theta);
            let cz = Math.cos(phi_angle);

            let rad = S;
            let hue = 0;
            let sat = 1.0;
            let light = 0.75;

            if (ratio < 0.1) {
                // +ssRNA Genome - Super-bright electric cyan-white nucleus
                rad = S * 0.12;
                cx = Math.sin(phi_angle) * Math.cos(theta);
                cy = Math.sin(phi_angle) * Math.sin(theta);
                cz = Math.cos(phi_angle);
                hue = 0.54;
                sat = 1.0;
                light = 0.92;
            } else if (ratio < 0.3) {
                // Nucleocapsid Core - Radiant sapphire and intense cyan icosahedral vertices
                const vIdx = Math.floor((ratio - 0.1) / 0.2 * 12) % 12;
                const vx = NORMALIZED_ICO_VERTS[vIdx][0];
                const vy = NORMALIZED_ICO_VERTS[vIdx][1];
                const vz = NORMALIZED_ICO_VERTS[vIdx][2];

                const blend = 0.35;
                cx = cx * (1 - blend) + vx * blend;
                cy = cy * (1 - blend) + vy * blend;
                cz = cz * (1 - blend) + vz * blend;

                const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
                const safeDist = Math.max(dist, 0.001);
                cx /= safeDist;
                cy /= safeDist;
                cz /= safeDist;

                rad = S * 0.28 * (1 + Math.sin(i * 0.3 + t * 2.5) * 0.18);
                hue = 0.56 + Math.sin(i * 0.4 + t) * 0.05;
                sat = 1.0;
                light = 0.72 + Math.sin(i * 0.5 + t * 1.5) * 0.22;
            } else if (ratio < 0.38) {
                // Lipid Envelope - Brilliant neon aqua/teal bilayer ring
                rad = S * 0.45 * (1 + Math.sin(i * 0.15 + t * 1.2) * 0.06);
                hue = 0.50;
                sat = 0.98;
                light = 0.80 + Math.sin(i * 0.2 + t * 0.8) * 0.15;
            } else if (ratio < 0.65) {
                // E Protein Dimers - Intense glowing magenta/violet spikes
                rad = S * 0.62 * (1 + Math.sin(i * 0.5 + t * 3) * 0.3);
                const eWave = Math.sin(i * 2.5 + t * 4) * 0.35;
                rad += eWave * (S * 0.12);
                hue = 0.78 + Math.sin(i * 0.6 + t * 2) * 0.06;
                sat = 1.0;
                light = 0.74 + Math.sin(i * 0.5 + t * 1.5) * 0.20;
            } else if (ratio < 0.85) {
                // M Protein - Vivid electric violet surface matrix
                rad = S * 0.72 * (1 + Math.sin(i * 0.4 + t * 3.2) * 0.25);
                const mWave = Math.cos(i * 3 + t * 5) * 0.3;
                rad += mWave * (S * 0.1);
                hue = 0.72 + Math.cos(i * 0.5 + t * 2.5) * 0.05;
                sat = 1.0;
                light = 0.76 + Math.sin(i * 0.4 + t * 1.8) * 0.20;
            } else {
                // Glycoprotein Spikes - Brilliant hot pink & rose corona flare
                rad = S * 0.84 * (1 + Math.sin(i * 0.35 + t * 3.8) * 0.45);
                const outerSpike = Math.cos(i * 3.5 + t * 5.5) * 0.3;
                rad += outerSpike * (S * 0.18);
                hue = 0.88 + Math.cos(i * 0.5 + t * 2.8) * 0.05;
                sat = 1.0;
                light = 0.82 + Math.sin(i * 0.4 + t * 2) * 0.16;
            }

            rad *= breathe;

            const rx = cx * cosA - cz * sinA;
            const rz = cx * sinA + cz * cosA;
            const ry = cy;

            target.set(rx * rad, ry * rad, rz * rad);
            color.setHSL(hue, Math.min(1.0, Math.max(0.0, sat)), Math.min(1.0, Math.max(0.0, light)));

            this.positions[i].lerp(target, 0.12);
            this.dummy.position.copy(this.positions[i]);

            this.dummy.scale.set(1, 1, 1);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }
}

// Export direct class name alias as requested
export const ParticlesSwarm = BioCapsidSimulation;

