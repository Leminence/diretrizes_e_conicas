const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const graphArea = document.getElementById('graphArea');
const coordsDisplay = document.getElementById('coords');

let offsetX = 0;
let offsetY = 0;
let scale = 40;
let isDragging = false;
let lastX, lastY;

let currentConic = null;

function resizeCanvas() {
    canvas.width = graphArea.clientWidth;
    canvas.height = graphArea.clientHeight;
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Mouse interactions
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - canvas.width / 2 - offsetX) / scale).toFixed(2);
    const y = (-(e.clientY - rect.top - canvas.height / 2 - offsetY) / scale).toFixed(2);
    
    // Check if mouse is on the conic curve
    let onCurve = false;
    if (currentConic) {
        if (currentConic.type === 'parabola') {
            const { A, B, C } = currentConic;
            const yOnCurve = A * x * x + B * x + C;
            if (Math.abs(parseFloat(y) - yOnCurve) < 0.5) {
                onCurve = true;
            }
        } else if (currentConic.type === 'ellipse') {
            const { a, b, h, k } = currentConic;
            const val = ((parseFloat(x) - h) ** 2) / (a ** 2) + ((parseFloat(y) - k) ** 2) / (b ** 2);
            if (Math.abs(val - 1) < 0.1) {
                onCurve = true;
            }
        } else if (currentConic.type === 'hyperbola') {
            const { a, b, h, k } = currentConic;
            const val = ((parseFloat(x) - h) ** 2) / (a ** 2) - ((parseFloat(y) - k) ** 2) / (b ** 2);
            if (Math.abs(val - 1) < 0.1) {
                onCurve = true;
            }
        }
    }
    
    coordsDisplay.textContent = `x: ${x}, y: ${y}${onCurve ? ' [na curva]' : ''}`;
    coordsDisplay.style.color = onCurve ? '#4CAF50' : '#999';

    if (isDragging) {
        offsetX += e.clientX - lastX;
        offsetY += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        draw();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= zoomFactor;
    draw();
});

// Update parameters based on conic type
document.getElementById('conicType').addEventListener('change', updateParams);

function updateParams() {
    const type = document.getElementById('conicType').value;
    const paramsDiv = document.getElementById('params');
    
    if (type === 'parabola') {
        paramsDiv.innerHTML = `
            <h2>Parâmetros da Parábola</h2>
            <label>A (coeficiente de x²):</label>
            <input type="number" id="paramA" value="1" step="0.1">
            <label>B (coeficiente de x):</label>
            <input type="number" id="paramB" value="0" step="0.1">
            <label>C (termo constante):</label>
            <input type="number" id="paramC" value="0" step="0.1">
        `;
    } else if (type === 'ellipse') {
        paramsDiv.innerHTML = `
            <h2>Parâmetros da Elipse</h2>
            <label>A (semi-eixo):</label>
            <input type="number" id="paramA" value="5" step="0.1" min="0.1">
            <label>B (semi-eixo):</label>
            <input type="number" id="paramB" value="3" step="0.1" min="0.1">
            <label>Centro X:</label>
            <input type="number" id="centerX" value="0" step="0.1">
            <label>Centro Y:</label>
            <input type="number" id="centerY" value="0" step="0.1">
        `;
    } else if (type === 'hyperbola') {
        paramsDiv.innerHTML = `
            <h2>Parâmetros da Hipérbole</h2>
            <label>A (semi-eixo transverso):</label>
            <input type="number" id="paramA" value="4" step="0.1" min="0.1">
            <label>B (semi-eixo conjugado):</label>
            <input type="number" id="paramB" value="3" step="0.1" min="0.1">
            <label>Centro X:</label>
            <input type="number" id="centerX" value="0" step="0.1">
            <label>Centro Y:</label>
            <input type="number" id="centerY" value="0" step="0.1">
        `;
    }
}

updateParams();

function calculate() {
    const type = document.getElementById('conicType').value;
    
    if (type === 'parabola') {
        calculateParabola();
    } else if (type === 'ellipse') {
        calculateEllipse();
    } else if (type === 'hyperbola') {
        calculateHyperbola();
    }
}

function calculateParabola() {
    const A = parseFloat(document.getElementById('paramA').value);
    const B = parseFloat(document.getElementById('paramB').value);
    const C = parseFloat(document.getElementById('paramC').value);

    // y = Ax² + Bx + C (forma padrão da parábola)
    const h = -B / (2 * A); // vértice x
    const k = A * h * h + B * h + C; // vértice y (calculado pela equação)
    const p = 1 / (4 * A); // parâmetro focal (distância do vértice ao foco)

    const focus = { x: h, y: k + p };
    const directrix = k - p;

    currentConic = {
        type: 'parabola',
        A, B, C, h, k, p, focus, directrix
    };

    // Ponto de teste P no vértice + 2p
    const Px = h + 2;
    const Py = A * Px * Px + B * Px + C;

    const distPF = Math.sqrt((Px - focus.x) ** 2 + (Py - focus.y) ** 2);
    const distPD = Math.abs(Py - directrix);
    const e = distPF / distPD;

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <strong>PARÁBOLA</strong><br><br>
        <div class="formula">Equação: y = Ax² + Bx + C</div>
        <div class="formula">y = ${A}x² + ${B}x + ${C}</div><br>
        
        <strong>Fórmulas Utilizadas:</strong><br>
        <div class="formula">Vértice: h = -B/(2A), k = C - B²/(4A)</div>
        <div class="formula">Parâmetro focal: p = 1/(4A)</div>
        <div class="formula">Foco: F = (h, k + p)</div>
        <div class="formula">Diretriz: y = k - p</div>
        <div class="formula">Excentricidade: e = 1 (sempre)</div><br>
        
        <strong>Resultados:</strong><br>
        Vértice: (${h.toFixed(3)}, ${k.toFixed(3)})<br>
        Foco: (${focus.x.toFixed(3)}, ${focus.y.toFixed(3)})<br>
        Diretriz: y = ${directrix.toFixed(3)}<br>
        <strong>Excentricidade: e = 1.000</strong><br>
        
        <div class="verification">
            <strong>Verificação Numérica:</strong><br>
            Ponto de teste P: (${Px.toFixed(3)}, ${Py.toFixed(3)})<br>
            |PF| = ${distPF.toFixed(6)}<br>
            dist(P, diretriz) = ${distPD.toFixed(6)}<br>
            <strong>|PF| / dist(P, diretriz) = ${e.toFixed(6)} ≈ 1</strong>
        </div>
    `;

    draw();
}

function calculateEllipse() {
    const a = parseFloat(document.getElementById('paramA').value);
    const b = parseFloat(document.getElementById('paramB').value);
    const h = parseFloat(document.getElementById('centerX').value);
    const k = parseFloat(document.getElementById('centerY').value);

    // Determine orientation based on which axis is larger
    const isHorizontal = a > b;
    const majorAxis = Math.max(a, b);
    const minorAxis = Math.min(a, b);
    const c = Math.sqrt(Math.abs(majorAxis * majorAxis - minorAxis * minorAxis));
    const e = c / majorAxis;

    let focus1, focus2, directrix1, directrix2;
    
    if (isHorizontal) {
        // Focos no eixo X
        focus1 = { x: h + c, y: k };
        focus2 = { x: h - c, y: k };
        directrix1 = h + (majorAxis * majorAxis) / c;
        directrix2 = h - (majorAxis * majorAxis) / c;
    } else {
        // Focos no eixo Y
        focus1 = { x: h, y: k + c };
        focus2 = { x: h, y: k - c };
        directrix1 = k + (majorAxis * majorAxis) / c;
        directrix2 = k - (majorAxis * majorAxis) / c;
    }

    currentConic = {
        type: 'ellipse',
        a, b, h, k, c, e, focus1, focus2, directrix1, directrix2, isHorizontal
    };

    // Ponto de teste no extremo do eixo maior
    let Px, Py;
    if (isHorizontal) {
        Px = h + a;
        Py = k;
    } else {
        Px = h;
        Py = k + b;
    }

    const distPF = Math.sqrt((Px - focus1.x) ** 2 + (Py - focus1.y) ** 2);
    const distPD = isHorizontal ? Math.abs(Px - directrix1) : Math.abs(Py - directrix1);
    const eCalc = distPF / distPD;

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    
    const orientationText = isHorizontal ? 'horizontal (A > B)' : 'vertical (B > A)';
    const directrixAxis = isHorizontal ? 'x' : 'y';
    
    resultDiv.innerHTML = `
        <strong>ELIPSE</strong><br><br>
        <div class="formula">Equação: (x-h)²/a² + (y-k)²/b² = 1</div>
        <div class="formula">(x-${h})²/${a}² + (y-${k})²/${b}² = 1</div>
        <div class="formula">Orientação: ${orientationText}</div><br>
        
        <strong>Fórmulas Utilizadas:</strong><br>
        <div class="formula">Eixo maior: ${majorAxis}, Eixo menor: ${minorAxis}</div>
        <div class="formula">Distância focal: c = √(maior² - menor²)</div>
        <div class="formula">Focos: no eixo ${isHorizontal ? 'X' : 'Y'}</div>
        <div class="formula">Diretrizes: ${directrixAxis} = centro ± maior²/c</div>
        <div class="formula">Excentricidade: e = c/maior</div><br>
        
        <strong>Resultados:</strong><br>
        Centro: (${h}, ${k})<br>
        Semi-eixos: a = ${a}, b = ${b}<br>
        Distância focal: c = ${c.toFixed(3)}<br>
        Foco 1: (${focus1.x.toFixed(3)}, ${focus1.y.toFixed(3)})<br>
        Foco 2: (${focus2.x.toFixed(3)}, ${focus2.y.toFixed(3)})<br>
        Diretriz 1: ${directrixAxis} = ${directrix1.toFixed(3)}<br>
        Diretriz 2: ${directrixAxis} = ${directrix2.toFixed(3)}<br>
        <strong>Excentricidade: e = ${e.toFixed(6)}</strong><br>
        
        <div class="verification">
            <strong>Verificação Numérica:</strong><br>
            Ponto de teste P: (${Px.toFixed(3)}, ${Py.toFixed(3)})<br>
            |PF₁| = ${distPF.toFixed(6)}<br>
            dist(P, diretriz₁) = ${distPD.toFixed(6)}<br>
            <strong>|PF| / dist(P, diretriz) = ${eCalc.toFixed(6)} ≈ ${e.toFixed(6)}</strong>
        </div>
    `;

    draw();
}

function calculateHyperbola() {
    const a = parseFloat(document.getElementById('paramA').value);
    const b = parseFloat(document.getElementById('paramB').value);
    const h = parseFloat(document.getElementById('centerX').value);
    const k = parseFloat(document.getElementById('centerY').value);

    const c = Math.sqrt(a * a + b * b);
    const e = c / a;

    const focus1 = { x: h + c, y: k };
    const focus2 = { x: h - c, y: k };
    const directrix1 = h + (a * a) / c;
    const directrix2 = h - (a * a) / c;

    currentConic = {
        type: 'hyperbola',
        a, b, h, k, c, e, focus1, focus2, directrix1, directrix2
    };

    // Ponto de teste no vértice
    const Px = h + a;
    const Py = k;

    const distPF = Math.abs(Px - focus1.x);
    const distPD = Math.abs(Px - directrix1);
    const eCalc = distPF / distPD;

    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = `
        <strong>HIPÉRBOLE</strong><br><br>
        <div class="formula">Equação: (x-h)²/a² - (y-k)²/b² = 1</div>
        <div class="formula">(x-${h})²/${a}² - (y-${k})²/${b}² = 1</div><br>
        
        <strong>Fórmulas Utilizadas:</strong><br>
        <div class="formula">Distância focal: c = √(a² + b²)</div>
        <div class="formula">Focos: F₁ = (h+c, k), F₂ = (h-c, k)</div>
        <div class="formula">Diretrizes: x = h ± a²/c</div>
        <div class="formula">Excentricidade: e = c/a</div><br>
        
        <strong>Resultados:</strong><br>
        Centro: (${h}, ${k})<br>
        Semi-eixos: a = ${a}, b = ${b}<br>
        Distância focal: c = ${c.toFixed(3)}<br>
        Foco 1: (${focus1.x.toFixed(3)}, ${focus1.y.toFixed(3)})<br>
        Foco 2: (${focus2.x.toFixed(3)}, ${focus2.y.toFixed(3)})<br>
        Diretriz 1: x = ${directrix1.toFixed(3)}<br>
        Diretriz 2: x = ${directrix2.toFixed(3)}<br>
        <strong>Excentricidade: e = ${e.toFixed(6)}</strong><br>
        
        <div class="verification">
            <strong>Verificação Numérica:</strong><br>
            Ponto de teste P: (${Px.toFixed(3)}, ${Py.toFixed(3)})<br>
            |PF₁| = ${distPF.toFixed(6)}<br>
            dist(P, diretriz₁) = ${distPD.toFixed(6)}<br>
            <strong>|PF| / dist(P, diretriz) = ${eCalc.toFixed(6)} ≈ ${e.toFixed(6)}</strong>
        </div>
    `;

    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2 + offsetX;
    const centerY = canvas.height / 2 + offsetY;

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    for (let x = centerX % scale; x < canvas.width; x += scale) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = centerY % scale; y < canvas.height; y += scale) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#64B5F6';
    ctx.font = '13px Courier New';
    ctx.fillText('X', canvas.width - 20, centerY - 10);
    ctx.fillText('Y', centerX + 10, 20);

    if (!currentConic) return;

    if (currentConic.type === 'parabola') {
        drawParabola(centerX, centerY);
    } else if (currentConic.type === 'ellipse') {
        drawEllipse(centerX, centerY);
    } else if (currentConic.type === 'hyperbola') {
        drawHyperbola(centerX, centerY);
    }
    
    // Draw numbers on axes
    ctx.fillStyle = '#999';
    ctx.font = '11px Courier New';
    
    // Determine interval based on zoom level
    let interval = 1;
    if (scale < 20) interval = 5;
    else if (scale < 30) interval = 2;
    else if (scale > 80) interval = 0.5;
    
    // X-axis numbers
    for (let i = -20; i <= 20; i++) {
        if (i === 0 || i % interval !== 0) continue;
        const x = centerX + i * scale;
        if (x >= 0 && x <= canvas.width) {
            ctx.fillText(i.toString(), x - 5, centerY + 15);
        }
    }
    
    // Y-axis numbers
    for (let i = -20; i <= 20; i++) {
        if (i === 0 || i % interval !== 0) continue;
        const y = centerY - i * scale;
        if (y >= 0 && y <= canvas.height) {
            ctx.fillText(i.toString(), centerX + 5, y + 4);
        }
    }
}

function drawParabola(cx, cy) {
    const { A, B, C, focus, directrix } = currentConic;

    // Draw parabola
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -20; x <= 20; x += 0.1) {
        const y = A * x * x + B * x + C;
        const screenX = cx + x * scale;
        const screenY = cy - y * scale;
        if (x === -20) {
            ctx.moveTo(screenX, screenY);
        } else {
            ctx.lineTo(screenX, screenY);
        }
    }
    ctx.stroke();

    // Draw focus
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(cx + focus.x * scale, cy - focus.y * scale, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw directrix
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, cy - directrix * scale);
    ctx.lineTo(canvas.width, cy - directrix * scale);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawEllipse(cx, cy) {
    const { a, b, h, k, focus1, focus2, directrix1, directrix2, isHorizontal } = currentConic;

    // Draw ellipse
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx + h * scale, cy - k * scale, a * scale, b * scale, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw foci
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(cx + focus1.x * scale, cy - focus1.y * scale, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + focus2.x * scale, cy - focus2.y * scale, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw directrices
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    if (isHorizontal) {
        // Vertical directrices
        ctx.beginPath();
        ctx.moveTo(cx + directrix1 * scale, 0);
        ctx.lineTo(cx + directrix1 * scale, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + directrix2 * scale, 0);
        ctx.lineTo(cx + directrix2 * scale, canvas.height);
        ctx.stroke();
    } else {
        // Horizontal directrices
        ctx.beginPath();
        ctx.moveTo(0, cy - directrix1 * scale);
        ctx.lineTo(canvas.width, cy - directrix1 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, cy - directrix2 * scale);
        ctx.lineTo(canvas.width, cy - directrix2 * scale);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function drawHyperbola(cx, cy) {
    const { a, b, h, k, focus1, focus2, directrix1, directrix2 } = currentConic;

    // Draw hyperbola
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    
    // Right branch
    ctx.beginPath();
    for (let x = a; x <= 20; x += 0.1) {
        const y = Math.sqrt(b * b * (x * x / (a * a) - 1));
        ctx.lineTo(cx + (h + x) * scale, cy - (k + y) * scale);
    }
    ctx.stroke();
    
    ctx.beginPath();
    for (let x = a; x <= 20; x += 0.1) {
        const y = Math.sqrt(b * b * (x * x / (a * a) - 1));
        ctx.lineTo(cx + (h + x) * scale, cy - (k - y) * scale);
    }
    ctx.stroke();

    // Left branch
    ctx.beginPath();
    for (let x = a; x <= 20; x += 0.1) {
        const y = Math.sqrt(b * b * (x * x / (a * a) - 1));
        ctx.lineTo(cx + (h - x) * scale, cy - (k + y) * scale);
    }
    ctx.stroke();
    
    ctx.beginPath();
    for (let x = a; x <= 20; x += 0.1) {
        const y = Math.sqrt(b * b * (x * x / (a * a) - 1));
        ctx.lineTo(cx + (h - x) * scale, cy - (k - y) * scale);
    }
    ctx.stroke();

    // Draw foci
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(cx + focus1.x * scale, cy - focus1.y * scale, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + focus2.x * scale, cy - focus2.y * scale, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw directrices
    ctx.strokeStyle = '#64B5F6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx + directrix1 * scale, 0);
    ctx.lineTo(cx + directrix1 * scale, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + directrix2 * scale, 0);
    ctx.lineTo(cx + directrix2 * scale, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}