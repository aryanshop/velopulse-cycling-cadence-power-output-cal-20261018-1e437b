document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const wheelSizeSelect = document.getElementById('wheelSize');
    const chainringInput = document.getElementById('chainring');
    const cogInput = document.getElementById('cog');
    const cadenceInput = document.getElementById('cadence');
    const cadenceValSpan = document.getElementById('cadenceVal');
    const crankLengthSelect = document.getElementById('crankLength');
    const riderWeightInput = document.getElementById('riderWeight');
    const bikeWeightInput = document.getElementById('bikeWeight');
    const gradientInput = document.getElementById('gradient');
    const headwindInput = document.getElementById('headwind');
    const riderPosSelect = document.getElementById('riderPos');
    
    const resSpeed = document.getElementById('resSpeed');
    const resRatio = document.getElementById('resRatio');
    const resDev = document.getElementById('resDev');
    const resPower = document.getElementById('resPower');
    const cadenceTableBody = document.querySelector('#cadenceTable tbody');
    const insightText = document.getElementById('insightText');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const canvas = document.getElementById('powerChart');
    const ctx = canvas.getContext('2d');

    // Constants for physics calculations
    const GRAVITY = 9.81;
    const AIR_DENSITY = 1.225; // kg/m^3 at sea level
    const DRIVETRAIN_LOSS = 0.03; // 3% mechanical loss
    const ROLLING_RESISTANCE_COEFF = 0.004; // typical road tire

    // Tab Switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            document.getElementById(`${target}-tab`).classList.add('active');
        });
    });

    // Preset Handlers
    const presets = {
        climbing: { chainring: 34, cog: 28, gradient: 8, headwind: 0, cadence: 75, pos: '0.32' },
        sprint: { chainring: 53, cog: 11, gradient: 0, headwind: 5, cadence: 110, pos: '0.18' },
        commute: { chainring: 42, cog: 18, gradient: 1, headwind: 10, cadence: 85, pos: '0.28' }
    };

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const p = presets[btn.dataset.preset];
            if (!p) return;
            chainringInput.value = p.chainring;
            cogInput.value = p.cog;
            gradientInput.value = p.gradient;
            headwindInput.value = p.headwind;
            cadenceInput.value = p.cadence;
            riderPosSelect.value = p.pos;
            calculateAll();
        });
    });

    // Event Listeners for real-time calculation
    const inputs = [wheelSizeSelect, chainringInput, cogInput, cadenceInput, crankLengthSelect, riderWeightInput, bikeWeightInput, gradientInput, headwindInput, riderPosSelect];
    inputs.forEach(el => {
        if (el) {
            el.addEventListener('input', calculateAll);
            el.addEventListener('change', calculateAll);
        }
    });

    function calculatePower(speedKmh, gradientPct, headwindKmh, totalMass, cda) {
        const v = speedKmh / 3.6; // speed in m/s
        const vWind = headwindKmh / 3.6; // headwind in m/s
        const vApp = Math.max(0, v + vWind); // apparent wind speed
        const theta = Math.atan(gradientPct / 100);

        // Forces (Newtons)
        const fGravity = totalMass * GRAVITY * Math.sin(theta);
        const fRolling = totalMass * GRAVITY * Math.cos(theta) * ROLLING_RESISTANCE_COEFF;
        const fAero = 0.5 * AIR_DENSITY * cda * vApp * vApp;

        const totalForce = Math.max(0, fGravity + fRolling + fAero);
        const powerAtWheel = totalForce * v;
        const powerTotal = powerAtWheel / (1 - DRIVETRAIN_LOSS);

        return {
            power: Math.round(powerTotal),
            aero: Math.round(0.5 * AIR_DENSITY * cda * vApp * vApp * v / (1 - DRIVETRAIN_LOSS)),
            rolling: Math.round(fRolling * v / (1 - DRIVETRAIN_LOSS)),
            gravity: Math.round(fGravity * v / (1 - DRIVETRAIN_LOSS))
        };
    }

    function calculateAll() {
        // Parse inputs safely
        const wheelCircumference = parseFloat(wheelSizeSelect.value) || 2.096;
        const chainring = parseFloat(chainringInput.value) || 50;
        const cog = parseFloat(cogInput.value) || 17;
        const cadence = parseFloat(cadenceInput.value) || 90;
        const riderMass = parseFloat(riderWeightInput.value) || 75;
        const bikeMass = parseFloat(bikeWeightInput.value) || 9;
        const gradient = parseFloat(gradientInput.value) || 0;
        const headwind = parseFloat(headwindInput.value) || 0;
        const cda = parseFloat(riderPosSelect.value) || 0.28;

        cadenceValSpan.textContent = cadence;

        // Drivetrain formulas
        const ratio = chainring / cog;
        const development = ratio * wheelCircumference; // meters per pedal revolution
        const speedMs = (development * cadence) / 60;
        const speedKmh = speedMs * 3.6;

        const totalMass = riderMass + bikeMass;
        const powerObj = calculatePower(speedKmh, gradient, headwind, totalMass, cda);

        // Update UI metrics
        resSpeed.textContent = speedKmh.toFixed(1);
        resRatio.textContent = ratio.toFixed(2);
        resDev.textContent = development.toFixed(2);
        resPower.textContent = powerObj.power;

        // Build Cadence Table
        cadenceTableBody.innerHTML = '';
        const cadenceSteps = [60, 70, 80, 90, 100, 110, 120];
        cadenceSteps.forEach(cad => {
            const stepSpeedMs = (development * cad) / 60;
            const stepSpeedKmh = stepSpeedMs * 3.6;
            const stepPower = calculatePower(stepSpeedKmh, gradient, headwind, totalMass, cda).power;
            
            const tr = document.createElement('tr');
            if (cad === cadence) {
                tr.classList.add('active-row');
            }
            tr.innerHTML = `
                <td>${cad} RPM</td>
                <td>${stepSpeedKmh.toFixed(1)} km/h</td>
                <td>${stepPower} W</td>
            `;
            cadenceTableBody.appendChild(tr);
        });

        // Generate Insights
        updateInsights(ratio, speedKmh, powerObj.power, gradient, cadence);

        // Draw Canvas Chart
        drawPowerChart(development, totalMass, gradient, headwind, cda, cadence);
    }

    function updateInsights(ratio, speed, power, gradient, cadence) {
        let msg = '';
        if (gradient > 5) {
            msg = `Steep climb detected (${gradient}%). Your current gear ratio (${ratio.toFixed(2)}) requires ${power}W. Consider dropping to a smaller chainring or larger cassette cog to keep cadence above 75 RPM.`;
        } else if (speed > 40) {
            msg = `High-speed descent/flat (${speed.toFixed(1)} km/h). Aerodynamic drag is the dominant resistance force. Lowering your torso position will significantly reduce wattage requirements.`;
        } else if (cadence < 70) {
            msg = `Low pedaling cadence (${cadence} RPM) increases muscular torque demand and knee joint stress. Shifting to an easier gear will improve cardiovascular efficiency.`;
        } else {
            msg = `Optimal cadence zone (${cadence} RPM) with balanced power output. Drivetrain efficiency is high and sustainable for endurance riding.`;
        }
        insightText.textContent = msg;
    }

    function drawPowerChart(development, totalMass, gradient, headwind, cda, activeCadence) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cadMin = 50;
        const cadMax = 120;
        const points = [];

        for (let c = cadMin; c <= cadMax; c += 5) {
            const sMs = (development * c) / 60;
            const sKmh = sMs * 3.6;
            const p = calculatePower(sKmh, gradient, headwind, totalMass, cda);
            points.push({ cadence: c, power: p.power, speed: sKmh });
        }

        const maxPower = Math.max(...points.map(p => p.power), 100);
        const padding = 30;
        const w = canvas.width - padding * 2;
        const h = canvas.height - padding * 2;

        // Draw axes
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, padding + h);
        ctx.lineTo(padding + w, padding + h);
        ctx.stroke();

        // Draw Power Line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        points.forEach((pt, index) => {
            const x = padding + ((pt.cadence - cadMin) / (cadMax - cadMin)) * w;
            const y = padding + h - (pt.power / maxPower) * h;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw active cadence point
        const activeSpeed = (development * activeCadence) / 60 * 3.6;
        const activePow = calculatePower(activeSpeed, gradient, headwind, totalMass, cda).power;
        const actX = padding + ((activeCadence - cadMin) / (cadMax - cadMin)) * w;
        const actY = padding + h - (activePow / maxPower) * h;

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(actX, actY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Axis Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('50 RPM', padding, padding + h + 15);
        ctx.fillText('120 RPM', padding + w, padding + h + 15);

        ctx.textAlign = 'right';
        ctx.fillText(`${maxPower}W`, padding - 5, padding + 10);
        ctx.fillText('0W', padding - 5, padding + h);
    }

    // Initial calculation on load
    calculateAll();
});
