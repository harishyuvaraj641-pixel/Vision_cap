import * as THREE from 'three';

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

export class ParticlesSwarm {
    constructor(container, count = 6500) {
        this.count = count;
        this.container = container;
        this.speedMult = 1.2644607573747635;
        this.disposed = false;
        this.animId = null;

        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;

        // SCENE & CAMERA — Calibrated distance (z=62) for a slightly bigger, prominent orb with zero clipping
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        this.camera.position.set(0, 0, 62);

        // RENDERER — Ultra-crisp high-DPI rendering with transparent alpha (no black border or box)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));

        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.container.appendChild(this.renderer.domElement);

        // OBJECTS
        this.dummy = new THREE.Object3D();
        this.color = new THREE.Color();
        this.target = new THREE.Vector3();
        this.pColor = new THREE.Color();

        // Refined crystal particle geometry (0.27) with additive blending
        this.geometry = new THREE.TetrahedronGeometry(0.27);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
        this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.mesh);

        this.positions = [];
        for (let i = 0; i < this.count; i++) {
            this.positions.push(new THREE.Vector3(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            ));
            this.mesh.setColorAt(i, this.color.setHex(0x00ffff));
        }

        this.clock = new THREE.Clock();

        // Calibrated base scale (25) for a slightly bigger orb with safe breathing margin
        this.params = {
            scale: 25,
            rotate: 0.5,
            pulse: 0.2
        };

        // Resize support
        this.handleResize = () => {
            if (this.disposed || !this.container) return;
            const w = this.container.clientWidth || 300;
            const h = this.container.clientHeight || 300;
            if (w === 0 || h === 0) return;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };

        if (window.ResizeObserver && this.container) {
            this.resizeObserver = new ResizeObserver(this.handleResize);
            this.resizeObserver.observe(this.container);
        }

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
        const breathe = 1 + Math.sin(t * 2) * pulse * 0.06;
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

            // UPDATE
            this.positions[i].lerp(target, 0.12);
            this.dummy.position.copy(this.positions[i]);
            this.dummy.scale.set(1, 1, 1);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
            this.mesh.setColorAt(i, color);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

        // Render with true alpha transparency
        this.renderer.render(this.scene, this.camera);
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
            console.warn('[ParticlesSwarm] Dispose warning:', e);
        }
    }
}
