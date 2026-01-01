/**
 * CanvasCharacterRenderer - Personajes Halo estilo Capcom 2D
 * Sistema de rotación articular para animaciones fluidas
 */
class CanvasCharacterRenderer {

    // Paletas de colores
    static COLORS = {
        spartan: {
            black: '#1a1a1a', dark: '#213021', base: '#355235', light: '#4E704E',
            gold: '#D4AF37', orange: '#C66509'
        },
        elite: {
            black: '#1a1a2a', dark: '#2a1a4a', base: '#4a2a7a', light: '#6a4a9a',
            skin: '#3a2a5a', skinLight: '#5a4a7a',
            cyan: '#00ffff', cyanDark: '#00aaaa'
        },
        brute: {
            black: '#1a1a0a', dark: '#3a2a1a', base: '#5c3a1a', light: '#7a4a2a',
            fur: '#4a3a2a', furDark: '#3a2a1a',
            red: '#ff4444', armor: '#6a4a3a'
        }
    };

    /**
     * Dibuja un personaje completo
     */
    static draw(ctx, character, pose, frame, x, y, width, height, facing) {
        // Crear instancia temporal del personaje apropiado
        const scale = Math.min(width / 50, height / 80);

        ctx.save();
        ctx.translate(x + width / 2, y + height - 32 * scale);
        ctx.scale(scale * facing, scale);

        switch (character) {
            case 'chief':
            case 'masterchief':
                this.drawSpartan(ctx, pose, frame);
                break;
            case 'elite':
                this.drawElite(ctx, pose, frame);
                break;
            case 'brute':
                this.drawBrute(ctx, pose, frame);
                break;
        }

        ctx.restore();
    }

    // =====================================================
    // MASTER CHIEF (SPARTAN)
    // =====================================================
    static drawSpartan(ctx, pose, frame) {
        const C = this.COLORS.spartan;

        // Calcular ciclo de animación
        let walkCycle = 0;
        let isAttacking = false;
        let isJumping = false;
        let isHurt = false;
        let isBlocking = false;

        switch (pose) {
            case 'walk':
                walkCycle = frame * 1.5;
                break;
            case 'punch':
            case 'kick':
            case 'special':
                isAttacking = true;
                walkCycle = frame * 0.3;
                break;
            case 'jump':
                isJumping = true;
                break;
            case 'hurt':
                isHurt = true;
                walkCycle = frame * 0.2;
                break;
            case 'block':
                isBlocking = true;
                break;
            default: // idle
                walkCycle = frame * 0.1;
        }

        // Ángulos de animación
        let hipAngle = Math.sin(walkCycle) * 0.6;
        let hipAngleBack = Math.sin(walkCycle + Math.PI) * 0.6;
        let kneeAngle = Math.abs(Math.sin(walkCycle)) * 0.8;
        let armAngle = Math.sin(walkCycle + Math.PI) * 0.8;

        if (isJumping) {
            hipAngle = -0.3;
            hipAngleBack = 0.3;
            kneeAngle = 0.6;
        }

        if (isHurt) {
            hipAngle = -0.2;
            hipAngleBack = 0.4;
        }

        // Visor gradient
        let visorGrad = ctx.createLinearGradient(0, -35, 15, -25);
        visorGrad.addColorStop(0, C.gold);
        visorGrad.addColorStop(1, C.orange);

        // 1. PIERNA TRASERA
        ctx.save();
        ctx.translate(-2, 8);
        ctx.rotate(hipAngleBack);
        ctx.fillStyle = '#182218';
        ctx.fillRect(-5, 0, 10, 16);
        ctx.translate(0, 14);
        ctx.rotate(Math.abs(Math.sin(walkCycle + Math.PI)) * 0.5);
        ctx.fillStyle = '#182218';
        ctx.fillRect(-4, 0, 9, 16);
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(-4, 14, 10, 4);
        ctx.restore();

        // 2. TORSO
        ctx.fillStyle = C.black;
        ctx.fillRect(-9, -4, 18, 14);
        ctx.fillStyle = C.base;
        ctx.fillRect(-8, 6, 16, 6);
        ctx.fillStyle = C.dark;
        ctx.fillRect(-8, 12, 16, 2);
        ctx.fillStyle = C.dark;
        ctx.fillRect(-13, -22, 26, 20);
        ctx.fillStyle = C.base;
        ctx.fillRect(-11, -20, 22, 12);
        ctx.fillStyle = C.light;
        ctx.fillRect(-10, -19, 9, 8);
        ctx.fillRect(1, -19, 9, 8);

        // 3. CASCO
        ctx.save();
        ctx.translate(0, -26);
        if (isHurt) ctx.rotate(-0.2);
        ctx.fillStyle = C.base;
        ctx.beginPath();
        ctx.moveTo(-9, 8);
        ctx.lineTo(-9, -8);
        ctx.lineTo(9, -8);
        ctx.lineTo(11, -2);
        ctx.lineTo(11, 2);
        ctx.lineTo(7, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = C.dark;
        ctx.fillRect(-9, -8, 19, 3);
        ctx.fillStyle = visorGrad;
        ctx.beginPath();
        ctx.moveTo(2, -5);
        ctx.lineTo(11, -5);
        ctx.lineTo(11, 1);
        ctx.lineTo(2, 1);
        ctx.fill();
        ctx.fillStyle = '#555';
        ctx.fillRect(-5, -2, 4, 4);
        ctx.restore();

        // 4. PIERNA DELANTERA
        ctx.save();
        ctx.translate(-2, 8);
        ctx.rotate(hipAngle);
        ctx.fillStyle = C.base;
        ctx.fillRect(-6, 0, 12, 16);
        ctx.fillStyle = C.light;
        ctx.fillRect(-6, 0, 3, 16);
        ctx.fillStyle = C.dark;
        ctx.fillRect(-1, 12, 8, 6);
        ctx.translate(0, 14);
        ctx.rotate(kneeAngle * 0.2);
        ctx.fillStyle = C.base;
        ctx.fillRect(-5, 0, 10, 16);
        ctx.fillStyle = C.dark;
        ctx.fillRect(2, 12, 5, 4);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(-5, 16, 13, 4);
        ctx.restore();

        // 5. BRAZO
        ctx.save();
        ctx.translate(-2, -20);

        if (isAttacking) {
            // Brazo extendido hacia el FRENTE (horizontal)
            ctx.rotate(-1.57 + frame * 0.1); // -90 grados = horizontal hacia adelante

            // Hombrera
            ctx.fillStyle = C.base;
            ctx.beginPath();
            ctx.arc(0, 0, 10, Math.PI, 0);
            ctx.fill();

            // Brazo extendido horizontalmente
            ctx.fillStyle = C.black;
            ctx.fillRect(-4, 0, 8, 18);

            // Antebrazo
            ctx.fillStyle = C.base;
            ctx.fillRect(-5, 16, 10, 22);
            ctx.fillStyle = C.light;
            ctx.fillRect(-5, 16, 3, 22);

            // Puño/Mano
            ctx.fillStyle = '#222';
            ctx.fillRect(-5, 36, 12, 10);

            // ARMA según tipo de ataque
            if (pose === 'punch') {
                // CUCHILLO DE COMBATE
                ctx.fillStyle = '#333';
                ctx.fillRect(-2, 44, 4, 8); // Mango
                ctx.fillStyle = '#888';
                ctx.fillRect(-1, 44, 2, 6); // Detalle mango

                // Hoja del cuchillo
                ctx.fillStyle = '#aaaacc';
                ctx.beginPath();
                ctx.moveTo(-2, 52);
                ctx.lineTo(0, 72);
                ctx.lineTo(2, 52);
                ctx.closePath();
                ctx.fill();

                // Filo brillante
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(0, 54);
                ctx.lineTo(0, 70);
                ctx.lineTo(1, 54);
                ctx.closePath();
                ctx.fill();

            } else if (pose === 'kick') {
                // ESPADA DE ENERGIA (Energy Sword corta)
                ctx.fillStyle = '#333';
                ctx.fillRect(-3, 44, 6, 6); // Empuñadura

                // Hoja de energía
                ctx.fillStyle = 'rgba(0, 200, 255, 0.8)';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.moveTo(-4, 50);
                ctx.lineTo(0, 85);
                ctx.lineTo(4, 50);
                ctx.closePath();
                ctx.fill();

                // Centro brillante
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.moveTo(-1, 52);
                ctx.lineTo(0, 80);
                ctx.lineTo(1, 52);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;

            } else if (pose === 'special') {
                // ENERGY SHIELD BASH (Escudo grande)
                ctx.fillStyle = 'rgba(0, 170, 255, 0.6)';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 25;

                // Escudo ovalado grande
                ctx.beginPath();
                ctx.ellipse(0, 55, 22, 28, 0, 0, Math.PI * 2);
                ctx.fill();

                // Borde del escudo
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Hexágonos internos del escudo
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 50, 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 60, 8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.shadowBlur = 0;
            }

        } else if (isBlocking) {
            // POSICION DE CUBRIRSE - Brazo cruzado frente al pecho
            ctx.rotate(-0.8); // Brazo levantado diagonal

            // Hombrera
            ctx.fillStyle = C.base;
            ctx.beginPath();
            ctx.arc(0, 0, 11, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = C.light;
            ctx.beginPath();
            ctx.arc(0, 0, 6, Math.PI, 0);
            ctx.fill();

            // Brazo
            ctx.fillStyle = C.black;
            ctx.fillRect(-4, 0, 8, 14);

            // Antebrazo cruzado (protegiendo)
            ctx.fillStyle = C.base;
            ctx.fillRect(-6, 12, 12, 18);
            ctx.fillStyle = C.light;
            ctx.fillRect(-6, 12, 4, 18);

            // Guante
            ctx.fillStyle = '#222';
            ctx.fillRect(-5, 28, 10, 8);

            // Efecto de escudo personal activo
            ctx.fillStyle = 'rgba(0, 170, 255, 0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 20, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.stroke();

        } else {
            // IDLE - Brazo relajado
            ctx.rotate(armAngle * 0.5);
            ctx.fillStyle = C.base;
            ctx.beginPath();
            ctx.arc(0, 0, 11, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = C.light;
            ctx.beginPath();
            ctx.arc(0, 0, 6, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = C.black;
            ctx.fillRect(-4, 0, 8, 14);
            ctx.fillStyle = C.base;
            ctx.fillRect(-5, 12, 10, 15);
            ctx.fillStyle = C.light;
            ctx.fillRect(-5, 12, 3, 15);
            ctx.fillStyle = '#222';
            ctx.fillRect(-4, 27, 8, 8);
        }
        ctx.restore();
    }

    // =====================================================
    // ELITE (SANGHEILI) - Código exacto del usuario
    // =====================================================
    // =====================================================
    // ELITE (SANGHEILI) - REFACTORED FOR HALO ACCURACY
    // =====================================================
    static drawElite(ctx, pose, frame) {
        // Colores del Elite (Refined Covenant Palette - Lighter)
        const C = {
            blueMain: '#3a5aa0',   // Lighter Cobalt for visibility
            blueLight: '#5d7bc0',  // Lighter Highlight
            darkMain: '#1a1a2e',
            darkLight: '#303045',
            undersuit: '#121212',
            joints: '#080808',
            eyes: '#ffaa00',
            plasmaGlow: '#00ffff',
            plasmaCore: '#e0ffff',
            silver: '#8899a6'
        };

        // Estados de animación
        let walkCycle = 0;
        let isAttacking = false;
        let isJumping = false;
        let isHurt = false;

        switch (pose) {
            case 'walk':
                walkCycle = Date.now() * 0.005;
                break;
            case 'punch':
            case 'kick':
            case 'special':
                isAttacking = true;
                break;
            case 'jump':
                isJumping = true;
                break;
            case 'block':
                isAttacking = false;
                break;
            case 'hurt':
                isHurt = true;
                break;
            default:
                walkCycle = 0;
        }

        // Helper para dibujar polígonos
        const poly = (points, color, glow = false, glowColor = null) => {
            ctx.fillStyle = color;

            if (glow) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = glowColor || color;
            }
            // ELSE: NO SHADOW, NO BORDER -> Clean Flat Look

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
            ctx.closePath();
            ctx.fill();

            // Reset just in case
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        };

        // Helper para dibujar piernas (Cinemática mejorada tipo Spartan pero Digitígrada)
        const drawLeg = (w, isBack) => {
            // Spartan Logic adapted:
            let thighRot = Math.sin(w) * 0.6;
            let kneeRot = Math.abs(Math.cos(w)) * 0.8;
            let footRot = Math.sin(w + Math.PI / 2) * 0.3;

            if (isJumping) { thighRot = -0.5; kneeRot = 0.8; footRot = 0.4; }

            ctx.save();
            ctx.rotate(thighRot);

            // Muslo (Upper Thigh) - EXTENDED UPWARDS to prevent gap
            // Critical fix: The top points are much higher (-15, -20) to go inside the pelvis
            poly([[-12, -20], [20, -25], [16, 45], [-16, 40]], C.darkMain);
            // Armor Plate (Thigh)
            poly([[-10, -10], [18, -15], [14, 35], [-12, 30]], isBack ? C.blueMain : C.blueLight);

            ctx.translate(0, 40);
            ctx.rotate(0.5 - kneeRot); // Rodilla inversa

            // Pantorrilla (Shin Guard)
            // Extended top and bottom for overlap
            poly([[-11, -8], [13, -8], [10, 55], [-14, 60]], C.darkMain);
            poly([[-9, 2], [11, 2], [7, 45], [-11, 50]], isBack ? C.blueMain : C.blueLight); // Shin Plate

            ctx.translate(0, 55);
            ctx.rotate(-0.5 + footRot * 0.5); // Pie

            // Pie / Pezuña
            // Extended top for overlap
            poly([[-12, -8], [18, -4], [25, 13], [-10, 13]], C.darkLight);
            poly([[-10, 0], [20, 5], [24, 12], [-8, 12]], isBack ? C.blueMain : C.blueLight); // Armor detail

            ctx.restore();
        };

        // Helper para dibujar Plasma Rifle
        const drawPlasmaRifle = () => {
            ctx.save();
            ctx.scale(0.85, 0.85);
            ctx.translate(-15, -10);
            poly([[0, 0], [30, -10], [55, 5], [60, 25], [40, 35], [-5, 20]], C.blueMain);
            poly([[5, -5], [25, -10], [45, 5], [10, 15]], C.blueLight);
            poly([[5, 20], [35, 35], [30, 50], [0, 45], [-10, 30]], C.darkMain);

            if (isAttacking) {
                ctx.shadowBlur = 30 + Math.random() * 10;
                ctx.fillStyle = C.plasmaCore;
            } else {
                ctx.shadowBlur = 20;
                ctx.fillStyle = C.plasmaGlow;
            }
            ctx.shadowColor = C.plasmaGlow;
            ctx.beginPath();
            ctx.moveTo(40, 10);
            ctx.lineTo(58, 18);
            ctx.lineTo(55, 28);
            ctx.lineTo(38, 22);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        // Helper para Energy Sword
        const drawEnergySword = () => {
            ctx.save();
            ctx.fillStyle = C.darkMain;
            ctx.fillRect(-5, 0, 10, 12);

            ctx.fillStyle = C.plasmaGlow;
            ctx.shadowColor = C.plasmaGlow;
            ctx.shadowBlur = 25;

            // Hoja 1
            ctx.beginPath();
            ctx.moveTo(-3, 12);
            ctx.lineTo(-10, 70);
            ctx.lineTo(0, 80);
            ctx.lineTo(3, 12);
            ctx.closePath();
            ctx.fill();

            // Hoja 2
            ctx.beginPath();
            ctx.moveTo(3, 12);
            ctx.lineTo(10, 70);
            ctx.lineTo(0, 80);
            ctx.lineTo(-3, 12);
            ctx.closePath();
            ctx.fill();

            // Centro brillante
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(-1, 15);
            ctx.lineTo(-5, 65);
            ctx.lineTo(0, 75);
            ctx.lineTo(5, 65);
            ctx.lineTo(1, 15);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            ctx.restore();
        };

        // Escalar y Posicionar
        ctx.save();
        ctx.scale(0.42, 0.42); // Slightly larger
        ctx.translate(0, 25);

        let w = walkCycle;
        let bob = Math.abs(Math.sin(w)) * 5;
        let breathe = Math.sin(w * 0.5) * 0.05;

        // "Predator Lean" - More pronounced hunch
        let bodyTilt = 0.25;

        if (isHurt) {
            ctx.rotate(-0.15);
        }

        // 1. PIERNA TRASERA
        ctx.save();
        ctx.translate(-15, 5);
        drawLeg(w + Math.PI, true);
        ctx.restore();

        // 2. PELVIS & ABDOMEN (LOWER BODY)
        // Draw this BEFORE the torso so the legs connect here
        ctx.save();
        ctx.translate(0, -15); // Center of pelvis

        // Pelvis - Large enough to cover leg joints
        poly([[-18, 5], [18, 0], [15, 30], [-15, 35]], C.undersuit);
        // Pelvis Armor
        poly([[-16, 0], [16, -5], [12, 10], [-12, 12]], C.darkMain);

        ctx.restore();

        // 3. TORSO SUPERIOR (CHEST & HEAD)
        ctx.save();
        ctx.translate(0, -25); // Move up from pelvis
        ctx.rotate(bodyTilt + breathe);

        // Abdomen (connecting pelvis to chest)
        poly([[-16, 20], [16, 15], [12, 45], [-12, 50]], C.undersuit);

        // Chest Main (Broad Shoulders)
        poly([[-30, -30], [25, -20], [20, 25], [-25, 35]], C.darkMain);
        // Chest Armor
        poly([[-28, -28], [23, -18], [15, 20], [-23, 28]], C.blueMain);
        poly([[-18, -18], [15, -12], [10, 10], [-15, 15]], C.blueLight);

        // CABEZA
        ctx.save();
        ctx.translate(28, -28); // Forward neck position
        ctx.rotate(breathe * 0.5);
        if (isHurt) ctx.rotate(-0.2);

        // Neck (Thick muscular neck)
        poly([[-25, 10], [-5, 5], [5, 20], [-20, 25]], C.undersuit);

        // Helmet / Head (Elongated)
        poly([[-35, -12], [30, -5], [50, 15], [15, 25], [-25, 20]], C.blueMain);
        poly([[-30, -8], [25, 0], [40, 10], [-20, 12]], C.blueLight); // Highlight
        poly([[25, 15], [45, 18], [40, 30], [20, 25]], C.darkLight); // Jaw/Mandibles

        // Eyes (Orange Glow)
        poly([[5, 5], [20, 8], [15, 15], [2, 12]], C.eyes, true, C.eyes);
        ctx.restore();
        ctx.restore();

        // 4. PIERNA DELANTERA
        ctx.save();
        ctx.translate(15, 5);
        drawLeg(w, false);
        ctx.restore();

        // 5. BRAZO Y RIFLE
        ctx.save();
        ctx.translate(25, -55); // Adjusted shoulder position

        if (pose === 'block') {
            // POSE DE BLOQUEO: Guardia con Espada de Energía
            ctx.rotate(0.2 + bodyTilt);
            ctx.translate(-5, 5);

            // Hombro
            poly([[-16, -16], [16, -16], [12, 12], [-12, 12]], C.darkMain);
            poly([[-14, -14], [14, -14], [10, 10], [-10, 10]], C.blueLight);

            // Brazo... 
            ctx.translate(0, 15);
            ctx.rotate(-1.5);

            // Re-ajuste para bloqueo frontal
            ctx.rotate(1.5); // Reset
            ctx.rotate(-0.5); // Brazo levantado diagonal

            poly([[-10, 0], [10, 0], [8, 40], [-8, 40]], C.darkMain);
            ctx.translate(0, 45);

            // Antebrazo horizontal cubriendo
            ctx.rotate(-1.8);
            poly([[-8, 0], [12, -2], [15, 40], [-10, 40]], C.joints);

            // Espada vertical/diagonal bloqueando
            ctx.translate(5, 40);
            ctx.rotate(Math.PI / 2 + 0.5); // Perpendicular al ataque
            drawEnergySword();

        } else if (pose === 'special') {
            // SPECIAL ...
            ctx.rotate(-1.5 + bodyTilt);

            // Hombro 
            poly([[-16, -16], [16, -16], [12, 12], [-12, 12]], C.darkMain);
            poly([[-14, -14], [14, -14], [10, 10], [-10, 10]], C.blueLight);

            // Brazo extendido
            ctx.translate(0, 15);
            poly([[-10, 0], [10, 0], [8, 40], [-8, 40]], C.darkMain);
            poly([[-5, 5], [5, 5], [4, 35], [-4, 35]], C.blueMain);

            // Mano
            poly([[-8, 40], [12, 38], [15, 52], [-10, 55]], C.joints);

            // Espada hacia adelante
            ctx.translate(0, 50);
            drawEnergySword();

        } else if (isAttacking) {
            // Disparo con rifle
            let recoil = Math.sin(frame * 0.5) * 0.4;
            ctx.rotate(-0.1 - recoil + bodyTilt);
            ctx.translate(recoil * -15, 0);

            // Hombro 
            poly([[-16, -16], [16, -16], [12, 12], [-12, 12]], C.darkMain);
            poly([[-14, -14], [14, -14], [10, 10], [-10, 10]], C.blueLight);

            ctx.translate(0, 15);
            ctx.rotate(0.4);
            poly([[-10, 0], [10, 0], [8, 40], [-8, 40]], C.darkMain);
            poly([[-5, 5], [5, 5], [4, 35], [-4, 35]], C.blueMain);
            poly([[-8, 40], [12, 38], [15, 52], [-10, 55]], C.joints);
            ctx.translate(5, 45);
            drawPlasmaRifle();

        } else {
            // Idle / Walk

            // "Predator Lean"
            let walkLean = bodyTilt;
            if (pose === 'walk') {
                walkLean += 0.1 + Math.sin(w) * 0.1;
                ctx.translate(0, 5); // Slight bob
            }

            ctx.rotate(walkLean);
            ctx.rotate(Math.sin(w) * 0.1);

            // Hombro 
            poly([[-16, -16], [16, -16], [12, 12], [-12, 12]], C.darkMain);
            poly([[-14, -14], [14, -14], [10, 10], [-10, 10]], C.blueLight);

            ctx.translate(0, 15);
            ctx.rotate(0.4); // Elbow bend
            poly([[-10, 0], [10, 0], [8, 40], [-8, 40]], C.darkMain);

            poly([[-5, 5], [5, 5], [4, 35], [-4, 35]], C.blueMain);
            poly([[-8, 40], [12, 38], [15, 52], [-10, 55]], C.joints);
            ctx.translate(5, 45);
            drawPlasmaRifle();
        }

        ctx.restore();
        ctx.restore();  // Para el scale
    }

    // =====================================================
    // BRUTE (JIRALHANAE) - Código del usuario con Gravity Hammer
    // =====================================================
    static drawBrute(ctx, pose, frame) {
        // Colores del Brute
        const C = {
            red: '#600',
            redBright: '#c00',
            steel: '#2a2a2a',
            steelLight: '#555',
            skin: '#1a1512',
            glow: '#bc13fe',
            white: '#fff'
        };

        // Estados de animación
        let walkCycle = 0;
        let isAttacking = false;
        let isJumping = false;
        let isHurt = false;
        let attackProgress = 0;

        switch (pose) {
            case 'walk':
                walkCycle = Date.now() * 0.004;
                break;
            case 'punch':
            case 'kick':
                isAttacking = true;
                attackProgress = (frame % 10) / 10;
                break;
            case 'special':
                isAttacking = true;
                attackProgress = (frame % 15) / 15;
                break;
            case 'jump':
                isJumping = true;
                break;
            case 'hurt':
                isHurt = true;
                break;
            default:
                // Idle - piernas quietas
                walkCycle = 0;
        }

        // Helper para dibujar polígonos
        const poly = (points, color, glowAmount = 0) => {
            ctx.fillStyle = color;
            if (glowAmount > 0) {
                ctx.shadowBlur = glowAmount;
                ctx.shadowColor = C.glow;
            }
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i][0], points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        };

        // Helper para dibujar piernas (más cortas)
        const drawLeg = (walkAngle, isBack) => {
            ctx.save();
            let thighRot = Math.sin(walkAngle) * 0.5;
            if (isJumping) thighRot = -0.3;

            ctx.rotate(thighRot);
            // Muslo más corto
            poly([[-15, -5], [15, -5], [18, 30], [-18, 30]], isBack ? C.steel : C.steelLight);

            ctx.translate(0, 28);
            let kneeRot = Math.abs(Math.cos(walkAngle)) * 0.6;
            if (isJumping) kneeRot = 0.4;
            ctx.rotate(kneeRot);
            // Pantorrilla más corta
            poly([[-18, 0], [18, 0], [22, 35], [-25, 35]], isBack ? C.steel : C.steelLight);

            ctx.restore();
        };



        // Escalar para coincidir con tamaño del Spartan
        ctx.save();
        ctx.scale(0.35, 0.35);
        ctx.translate(0, 80);

        let w = walkCycle;
        let bob = Math.abs(Math.sin(w * 2)) * 6;

        if (isHurt) {
            ctx.rotate(-0.15);
        }

        // 1. PIERNA TRASERA
        ctx.save();
        ctx.translate(-15, -30 + bob);
        drawLeg(w + Math.PI, true);
        ctx.restore();

        // 2. TORSO E INCLINACIÓN
        ctx.save();
        ctx.translate(0, -65 + bob);

        let lean = 0;
        if (isAttacking) {
            lean = attackProgress < 0.5
                ? -attackProgress * 0.2
                : -0.1 + (attackProgress - 0.5) * 1.2;
        }
        ctx.rotate(lean);

        // Torso
        poly([[-45, -45], [45, -50], [18, 45], [-18, 50]], C.steel);
        poly([[-38, -38], [38, -42], [12, 0], [-12, 5]], C.redBright);

        // 3. CABEZA
        ctx.save();
        ctx.translate(22, -48);
        ctx.rotate(lean * 0.3);

        // Casco
        poly([[-18, -12], [15, -18], [22, 15], [-18, 15]], C.steel);
        // Cara
        poly([[-10, 0], [14, 5], [12, 22], [-10, 20]], C.skin);
        // Ojo
        ctx.fillStyle = "orange";
        ctx.fillRect(8, 6, 5, 3);
        // Mandíbula
        poly([[-8, 15], [18, 18], [12, 35], [-8, 30]], C.red);

        ctx.restore();
        ctx.restore();

        // 4. PIERNA DELANTERA
        ctx.save();
        ctx.translate(15, -30 + bob);
        drawLeg(w, false);
        ctx.restore();

        // 5. BRAZO Y MARTILLO (al final para que esté al frente)
        ctx.save();
        ctx.translate(0, -65 + bob);
        ctx.rotate(lean);
        ctx.translate(-15, -45);

        // Helper para Brute Plasma Rifle (Diseño mejorado: Cobre/Rojo + Luces Azules + Plasma Rosa)
        const drawBrutePlasmaRifle = () => {
            // 1. Cuerpo principal (Reddish Copper)
            ctx.fillStyle = "#B84A39"; // Cobre rojizo
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.lineTo(30, -8);  // Barrel top
            ctx.lineTo(25, 10);  // Front bottom
            ctx.lineTo(-5, 15);  // Handle bottom
            ctx.lineTo(-15, 5);  // Back
            ctx.fill();

            // 2. Detalles de textura (Hexágonos simulados / Carcasa superior)
            ctx.fillStyle = "#8A2A1D"; // Darker copper
            ctx.fillRect(-8, -12, 30, 6); // Top cover

            // 3. Luces Azules (Típicas Covenant/Brute)
            ctx.fillStyle = "#00FFFF";
            ctx.shadowColor = "#00FFFF";
            ctx.shadowBlur = 8;
            ctx.fillRect(0, -5, 15, 2); // Side strip
            ctx.fillRect(18, -10, 6, 2); // Top light
            ctx.shadowBlur = 0;

            // 4. Puntas del cañón (Negro/Metal)
            ctx.fillStyle = "#222";
            ctx.beginPath();
            ctx.moveTo(30, -8);
            ctx.lineTo(40, -10); // Top prong
            ctx.lineTo(38, -4);
            ctx.lineTo(30, -4);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(25, 6);
            ctx.lineTo(35, 8);   // Bottom prong
            ctx.lineTo(33, 2);
            ctx.lineTo(25, 4);
            ctx.fill();

            // 5. Núcleo de Plasma (Rosa/Púrpura)
            if ((pose === 'kick' || isAttacking) && frame % 4 < 2) {
                // Firing state - Bright Pink
                ctx.fillStyle = "#FF00FF";
                ctx.shadowColor = "#FF00FF";
                ctx.shadowBlur = 20;
                ctx.fillRect(25, -2, 8, 8); // Core glow

                // Muzzle flash / Beam start
                ctx.fillStyle = "rgba(255, 100, 255, 0.9)";
                ctx.fillRect(35, -1, 60, 6);
                ctx.shadowBlur = 0;
            } else {
                // Idle state - Dark purple
                ctx.fillStyle = "#660066";
                ctx.fillRect(25, -2, 8, 8);
            }
        };

        // Helper para Double Punch (Dos puños juntos)
        const drawDoublePunchArms = (progress) => {
            // Ambos brazos salen del frente
            // Brazo Izquierdo (Fondo)
            ctx.save();
            ctx.translate(10, -5); // Hombro izq bajado (de -42 a -5)

            let ext = 0;
            if (progress < 0.3) ext = -10 * (progress / 0.3); // Anticipación (atrás)
            else if (progress < 0.5) ext = 50; // Golpe
            else ext = 50 - (progress - 0.5) / 0.5 * 50; // Recuperación

            ctx.rotate(0.1); // Leve ángulo hacia adentro

            // Brazo
            poly([[-18, -15], [35 + ext, -12], [30 + ext, 15], [-18, 20]], "#3a2a1a"); // Oscuro
            // Puño
            ctx.fillStyle = "#333";
            ctx.fillRect(35 + ext, -10, 18, 24);
            ctx.restore();

            // Brazo Derecho (Frente)
            ctx.save();
            ctx.translate(-5, -5); // Hombro derecho bajado (de -40 a -5)
            ctx.rotate(-0.1); // Leve ángulo hacia adentro

            // Brazo skin
            poly([[-18, -22], [45 + ext, -20], [40 + ext, 15], [-18, 25]], C.skin);
            // Hombrera
            poly([[0, -30], [42, -32], [35, 0], [0, 0]], C.redBright);

            // Puño con Nudillera
            ctx.translate(35 + ext, 5);
            ctx.fillStyle = C.skin;
            ctx.fillRect(0, -12, 15, 24);
            ctx.fillStyle = C.steel;
            ctx.beginPath();
            ctx.moveTo(10, -15);
            ctx.lineTo(25, -10);
            ctx.lineTo(28, 0);
            ctx.lineTo(25, 10);
            ctx.lineTo(10, 15);
            ctx.fill();

            // Impact Effect
            if (progress > 0.3 && progress < 0.45) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                ctx.beginPath();
                ctx.arc(35, 0, 20 + Math.random() * 10, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        };

        // Helper para Brute Knife (Cuchillo Serrado / Machete)
        const drawBruteKnife = (angle) => {
            ctx.save();
            ctx.rotate(angle);

            // Mango
            ctx.fillStyle = "#222";
            ctx.fillRect(-5, -5, 10, 25);

            // Hoja (Silver/Steel with serrated edge)
            ctx.fillStyle = C.steel;
            ctx.beginPath();
            ctx.moveTo(-5, 20);
            ctx.lineTo(-8, 60); // Tip back
            ctx.lineTo(0, 65);  // Sharp tip
            ctx.lineTo(12, 50); // Belly
            ctx.lineTo(8, 20);  // Base
            ctx.fill();

            // Filo rojo/sangre (opcional)
            ctx.fillStyle = "#880000";
            ctx.beginPath();
            ctx.moveTo(0, 65);
            ctx.lineTo(5, 50);
            ctx.lineTo(0, 40);
            ctx.fill();

            // Serrated detail
            ctx.fillStyle = "#111";
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-8, 30 + i * 10);
                ctx.lineTo(-4, 35 + i * 10);
                ctx.lineTo(-8, 40 + i * 10);
                ctx.fill();
            }

            ctx.restore();
        };

        if (pose === 'block') {
            // POSE DE BLOQUEO: Brazos Arriba al Frente (Shielding Face)

            // Brazo Izquierdo (Fondo)
            ctx.save();
            ctx.translate(15, 10);
            ctx.rotate(-1.2); // Angulado hacia el frente/arriba
            ctx.fillStyle = "#3a2a1a";
            ctx.fillRect(0, -10, 35, 22);
            ctx.restore();

            // Brazo Derecho (Frente)
            ctx.save();
            ctx.translate(5, 10);
            ctx.rotate(-1.0); // Angulado hacia el frente (High Guard)

            // Brazo
            poly([[-10, -20], [40, -18], [35, 15], [-10, 20]], C.skin);
            // Hombrera visible (ajustada para pose vertical)
            ctx.save();
            ctx.rotate(0.5); // Rotar hombrera relativa al brazo
            poly([[-10, -25], [20, -28], [15, 0], [-5, 0]], C.redBright);
            ctx.restore();

            // Guantelete (Forearm/Shield)
            ctx.fillStyle = C.steel;
            ctx.fillRect(35, -20, 15, 40); // Más largo para cubrir

            ctx.restore();

        } else if (pose === 'special') {
            // ATAQUE ESPECIAL: DOBLE PUÑETAZO (Aplastar)
            drawDoublePunchArms(attackProgress);

        } else if (pose === 'punch') {
            // ATAQUE 1: Puñetazo Brutal (Melee) con Brazo Derecho (Frontal)

            // Brazo Izquierdo (Atrás - Sosteniendo Rifle en reposo o escondido)
            // Como este bloque dibuja "encima" del cuerpo, dibujar el brazo de atrás aquí se vería mal (flotando).
            // Idealmente el brazo de atrás se dibuja ANTES del cuerpo. 
            // Pero para simplificar sin reestructurar todo drawBrute:
            // Dibujaremos el Brazo Izquierdo (Rifle) lo más "atrás" posible o simplemente lo ocultamos/pegamos al cuerpo.

            ctx.save();
            ctx.translate(10, -45); // Hombro izquierdo más atrás
            ctx.rotate(0.5);
            // Brazo oscuro (sombra)
            ctx.fillStyle = "#3a2a1a"; // Piel oscura sombra
            ctx.fillRect(0, -10, 25, 18);
            // Rifle en mano izq (oscuro)
            ctx.translate(25, 0);
            ctx.rotate(0.5);
            // Rifle simplificado sombra
            ctx.fillStyle = "#401010";
            ctx.fillRect(-10, -5, 40, 15);
            ctx.restore();

            // Brazo Derecho (Frente - PUÑETAZO ESTILO 'H')
            ctx.save();
            // ctx.translate(-5, -40); // REMOVED to match Kick height exactly

            let punchExt = 0;
            if (attackProgress < 0.3) punchExt = attackProgress / 0.3 * 40;
            else if (attackProgress < 0.5) punchExt = 40;
            else punchExt = 40 - (attackProgress - 0.5) / 0.5 * 40;

            ctx.rotate(0); // Apuntar al frente

            // 1. Brazo (Estirándose)
            // Usamos el estilo 'poly' de la H, pero estiramos los vértices finales (X > 0) con punchExt
            poly([[-18, -22], [45 + punchExt, -20], [40 + punchExt, 15], [-18, 25]], C.skin);

            // 2. Hombrera (Estática en el hombro)
            poly([[0, -30], [42, -32], [35, 0], [0, 0]], C.redBright);

            // 3. Puño (En la punta del brazo estirado)
            ctx.translate(35 + punchExt, 5); // Base en 35 + extensión

            // Mano/Muñeca
            ctx.fillStyle = C.skin;
            ctx.fillRect(0, -12, 15, 24);
            // Nudillo de Acero (Spiked Knuckle)
            ctx.fillStyle = C.steel;
            ctx.beginPath();
            ctx.moveTo(10, -15);
            ctx.lineTo(25, -10); // Punta arriba
            ctx.lineTo(28, 0);   // Punta medio
            ctx.lineTo(25, 10);  // Punta abajo
            ctx.lineTo(10, 15);
            ctx.fill();

            // Speed Lines for Punch
            if (isAttacking && attackProgress > 0.3 && attackProgress < 0.5) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
                ctx.fillRect(10, -20, 50, 40); // Blur
            }

            ctx.restore();

        } else if (pose === 'kick' || (isAttacking && pose !== 'punch' && pose !== 'special')) {
            // ATAQUE 2: Disparo con Brute Plasma Rifle (Ranged)
            // Usamos 'kick' como input para disparo secundario
            let recoil = Math.sin(frame * 30) * 0.1;
            ctx.rotate(0.1 + recoil);

            // Brazo sosteniendo el rifle
            poly([[-18, -22], [45, -20], [40, 15], [-18, 25]], C.skin);
            poly([[0, -30], [42, -32], [35, 0], [0, 0]], C.redBright); // Hombrera

            ctx.translate(35, 5);
            drawBrutePlasmaRifle();
        } else {
            // Idle - sosteniendo el rifle relajado
            let swing = 0.8 + Math.sin(w) * 0.05;
            ctx.rotate(swing);
            // Brazo
            poly([[-18, -22], [45, -20], [40, 15], [-18, 25]], C.skin);
            poly([[0, -30], [42, -32], [35, 0], [0, 0]], C.redBright);

            // Rifle apuntando abajo/descansando
            ctx.translate(35, 5);
            ctx.rotate(0.5); // Rifle colgando un poco
            drawBrutePlasmaRifle();
        }
        ctx.restore();
        ctx.restore();  // Para el scale
    }
}

// Exportar
if (typeof window !== 'undefined') {
    window.CanvasCharacterRenderer = CanvasCharacterRenderer;
}
