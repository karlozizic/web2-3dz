const canvas = document.getElementById('canvas-game')
const ctx = canvas.getContext('2d');

//definiramo konstante
const PALICA_WIDTH = 120;
const PALICA_HEIGHT= 15;
const PALICA_BRZINA = 5;
const LOPTA_RAIDUS = 7.5;
const LOPTA_BRZINA = 3;
const CIGLA_SIRINA = 125;
const CIGLA_VISINA = 17.5;
const BROJ_REDOVA_CIGLI = 5;
const BROJ_KOLONA_CIGLI = 13;
const CIGLA_PADDING = 10;

let score = 0;
localStorage.setItem('bestScore', 0);

let palica = {
    x : 0,
    y : 0,
    width: PALICA_WIDTH,
    height: PALICA_HEIGHT,
    v_x: 0,
    v_y: 0
};

let lopta = {
    x: 0,
    y: 0,
    radius: LOPTA_RAIDUS,
    v_x: 0,
    v_y: 0
};

let bricks = [];

function createBricks() {
    //definiramo pomak od ruba - dijelimo širinu ekrana s brojem cigli i paddingom
    const pomak_x = (canvas.width - (BROJ_KOLONA_CIGLI * (CIGLA_SIRINA + CIGLA_PADDING))) / 2;
    const pomak_y = 30;

    //kreiramo matricu cigli
    for (let row = 0; row < BROJ_REDOVA_CIGLI; row++) {
        bricks[row] = [];
        for(let column = 0; column < BROJ_KOLONA_CIGLI; column++) {
            bricks[row][column] = {
                x: pomak_x + column * (CIGLA_SIRINA + CIGLA_PADDING),
                y: pomak_y + row * (CIGLA_VISINA + CIGLA_PADDING),
                aktivna: 1
            };
        }
    }
}

function checkWin(){
    for (let row = 0; row < BROJ_REDOVA_CIGLI; row++) {
        for (let column = 0; column < BROJ_KOLONA_CIGLI; column++) {
            if (bricks[row][column].aktivna === 1) {
                return false;
            }
        }
    }
    return true;
}

function drawObjects(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //scores
    ctx.fillText('Best score: ' + localStorage.getItem('bestScore'), canvas.width - 100, 10);
    ctx.fillText('Score: ' + score, canvas.width - 100, 20);

    ctx.fillStyle = 'red';
    ctx.shadowColor = 'white';
    //crtanje i sjencanje palice i cigli na rubovima
    ctx.shadowBlur = 5;
    ctx.fillRect(palica.x, palica.y, PALICA_WIDTH, PALICA_HEIGHT);

    for (let row = 0; row < BROJ_REDOVA_CIGLI; row++) {
        for (let column = 0; column < BROJ_KOLONA_CIGLI; column++) {
            if (bricks[row][column].aktivna === 1) {
                ctx.fillStyle = 'purple';
                ctx.fillRect(bricks[row][column].x, bricks[row][column].y, CIGLA_SIRINA, CIGLA_VISINA);
            }
        }
    }

    //uklanjamo sjencanje za loptu
    ctx.shadowBlur = 0;

    //lopta
    //zapocinje novu putanju za crtanje
    ctx.beginPath();
    //krug
    ctx.arc(lopta.x, lopta.y, LOPTA_RAIDUS, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    //zatvara putanju
    ctx.closePath();
}


function initializeCanvas(){
    score = 0;
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    createBricks();

    //inicijalne pozicije
    palica.x = (canvas.width - PALICA_WIDTH) / 2;
    palica.y = canvas.height - PALICA_HEIGHT - 15;
    lopta.x = palica.x + (PALICA_WIDTH / 2);
    lopta.y = palica.y - LOPTA_RAIDUS;

    //random smjer lopte => [-1, 1] * brzina lopte
    lopta.v_x = LOPTA_BRZINA * (Math.random() * 2 - 1);
    lopta.v_y = -1 * LOPTA_BRZINA;

    lopta.x += lopta.v_x;
    lopta.y += lopta.v_y;

    drawObjects();
}

function addKeyBindings(){
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            palica.v_x = -PALICA_BRZINA;
        }
        if (e.key === 'ArrowRight') {
            palica.v_x = PALICA_BRZINA;
        }
    });

    //moramo ovo dodati jer bi se inace palica nastavila kretati i nakon sto pustimo tipku
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            palica.v_x = 0;
        }
        if (e.key === 'ArrowRight') {
            palica.v_x = 0;
        }
    });
}

function movement(){
    //pomicanje palice
    palica.x += palica.v_x;
    //granice palice - ne smije izaci iz "okvira"
    if (palica.x <= 0) {
        palica.x = 0;
    }
    if (palica.x >= canvas.width - PALICA_WIDTH) {
        palica.x = canvas.width - PALICA_WIDTH;
    }

    //sudar lopte s zidovima => promjena smjera
    if (lopta.x - LOPTA_RAIDUS <= 0
        || lopta.x + LOPTA_RAIDUS >= canvas.width) {
        lopta.v_x = -lopta.v_x;
    }
    if (lopta.y - LOPTA_RAIDUS <= 0) {
        lopta.v_y = -lopta.v_y;
    }
    //lopta i palica
    if (lopta.y + LOPTA_RAIDUS >= palica.y && // je li donji rub lopte na visini palice
        lopta.y - LOPTA_RAIDUS <= palica.y + PALICA_HEIGHT && // gornji rub lopte mora biti iznad palice
        lopta.x >= palica.x && // sredina lopte mora biti desno od lijevog ruba palice
        lopta.x <= palica.x + PALICA_WIDTH) // sredina lopte mora biti lijevo od desnog ruba palice
    {
        lopta.v_y = -LOPTA_BRZINA;
    }
    //lopta i cigle
    for(let row = 0; row < BROJ_REDOVA_CIGLI; row++) {
        for(let column = 0; column < BROJ_KOLONA_CIGLI; column++) {
            if (bricks[row][column].aktivna === 1) {
                if (lopta.x >= bricks[row][column].x &&
                    lopta.x <= bricks[row][column].x + CIGLA_SIRINA &&
                    lopta.y + LOPTA_RAIDUS >= bricks[row][column].y &&
                    lopta.y - LOPTA_RAIDUS <= bricks[row][column].y + CIGLA_VISINA)
                {
                    bricks[row][column].aktivna = 0;
                    lopta.v_y = -lopta.v_y;
                    score++;
                }
            }
        }
    }

    //gubitak igre
    if (lopta.y + LOPTA_RAIDUS >= canvas.height) {

        if (score > localStorage.getItem('bestScore')) {
            localStorage.setItem('bestScore', score);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '30px Comic Sans MS';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);

        //kratki delay prije restarta igre
        setTimeout(function() {
            initializeCanvas();
        }, 500);

        return;
    }

    if (checkWin()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = '30px Comic Sans MS';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';

        if (score > localStorage.getItem('bestScore')) {
            localStorage.setItem('bestScore', score);
        }

        ctx.fillText('You win!', canvas.width / 2, canvas.height / 2);

        setTimeout(function() {
            initializeCanvas();
        }, 500);

        return;
    }

    lopta.x += lopta.v_x;
    lopta.y += lopta.v_y;

    drawObjects();
}


function game_loop(){
    movement();
    requestAnimationFrame(game_loop);
}

initializeCanvas();
addKeyBindings();
game_loop();