# VeloPulse: Cycling Cadence & Power Output Calculator

## Overview
VeloPulse is a high-precision bicycle drivetrain simulator and performance calculator built with vanilla HTML5, CSS3, and JavaScript. Designed for cyclists, commuters, and fitness enthusiasts, it bridges gear mechanics with biomechanical power output estimations.

## Features
- **Drivetrain Customization**: Configure wheel size/tire dimensions, chainring teeth, rear cog teeth, crankarm length, and pedaling cadence.
- **Environmental & Rider Metrics**: Account for rider mass, bike weight, road gradient (slope percentage), headwind speed, and aerodynamic riding position (CdA).
- **Real-Time Physics Engine**: Computes aerodynamic drag, rolling resistance, and gravitational force using rigorous cycling physics formulas.
- **Cadence Speed Matrix**: Instantly inspect speeds and power requirements across standard cadence intervals (60-120 RPM).
- **Interactive Power-Curve Canvas**: Dynamically renders a power-to-speed curve chart with custom tooltips and visual indicators.
- **Preset Profiles**: One-click configuration for climbing setups, flat sprints, and urban commutes.

## Local Run Instructions
1. Download or clone the repository.
2. Open `index.html` in any modern web browser.
3. No build tools, package managers, or server setups required.

## Technical Architecture
- **Vanilla Stack**: Pure HTML5, CSS3 Grid/Flexbox, and ES6+ JavaScript.
- **HTML5 Canvas**: Lightweight chart rendering without external graphing libraries.
- **Privacy First**: Fully client-side computation with zero tracking or data transmission.
