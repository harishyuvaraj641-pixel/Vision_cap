import React, { useRef, useEffect } from 'react';
import {
    NeuralBrainSimulation,
    SingularitySimulation,
    QuantumKnotSimulation,
    BioCapsidSimulation,
    ParticlesSwarm
} from './visualizers/ParticleSimulations';

export default function HolographicParticleCore({
    mode = 'capsid',
    status = 'idle',
    count = 6500,
    className = ''
}) {
    const containerRef = useRef(null);
    const simulationRef = useRef(null);

    // Initialize or switch simulation when mode or count changes
    useEffect(() => {
        if (!containerRef.current) return;

        // Clean up any previous simulation
        if (simulationRef.current) {
            simulationRef.current.dispose();
            simulationRef.current = null;
        }

        try {
            if (mode === 'brain') {
                simulationRef.current = new NeuralBrainSimulation(containerRef.current, count);
            } else if (mode === 'singularity') {
                simulationRef.current = new SingularitySimulation(containerRef.current, count);
            } else if (mode === 'quantum') {
                simulationRef.current = new QuantumKnotSimulation(containerRef.current, count);
            } else {
                // Default to BioCapsid / ParticlesSwarm (replacing old orb)
                simulationRef.current = new BioCapsidSimulation(containerRef.current, count);
            }
            if (simulationRef.current) {
                simulationRef.current.setStatus(status);
            }
        } catch (err) {
            console.warn('[HolographicParticleCore] WebGL instantiation warning:', err);
        }

        return () => {
            if (simulationRef.current) {
                simulationRef.current.dispose();
                simulationRef.current = null;
            }
        };
    }, [mode, count]);

    // Live reactivity to status changes without re-initializing WebGL scene
    useEffect(() => {
        if (simulationRef.current && simulationRef.current.setStatus) {
            simulationRef.current.setStatus(status);
        }
    }, [status]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'visible',
                background: 'transparent',
                borderRadius: 'inherit'
            }}
        />
    );
}
